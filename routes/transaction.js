const express = require('express');
const { Account, Transaction, User } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 🔹 입금 API
router.post('/deposit', authMiddleware, async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.userId;

    if (amount <= 0) return res.status(400).json({ message: "올바른 금액을 입력하세요." });

    try {
        // 사용자 계좌 찾기
        const account = await Account.findOne({ where: { user_id: userId } });
        if (!account) return res.status(404).json({ message: "계좌를 찾을 수 없습니다." });

        // 잔액 업데이트
        account.balance += amount;
        await account.save();

        // 입금 기록 생성
        await Transaction.create({ account_id: account.id, amount, type: 'deposit' });

        res.json({ message: `${amount}원이 입금되었습니다.`, balance: account.balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// 🔹 송금 API
router.post('/transfer', authMiddleware, async (req, res) => {
    const { receiverUsername, amount } = req.body;
    const senderId = req.user.userId;

    if (amount <= 0) return res.status(400).json({ message: "올바른 금액을 입력하세요." });

    try {
        // 송금자 계좌 찾기
        const senderAccount = await Account.findOne({ where: { user_id: senderId } });
        if (!senderAccount || senderAccount.balance < amount) {
            return res.status(400).json({ message: "잔액이 부족합니다." });
        }

        // 수신자 찾기
        const receiver = await User.findOne({ where: { username: receiverUsername } });
        if (!receiver) return res.status(404).json({ message: "수신자를 찾을 수 없습니다." });

        // 수신자 계좌 찾기
        const receiverAccount = await Account.findOne({ where: { user_id: receiver.id } });
        if (!receiverAccount) return res.status(404).json({ message: "수신자의 계좌를 찾을 수 없습니다." });

        // 송금 처리
        senderAccount.balance -= amount;
        receiverAccount.balance += amount;
        await senderAccount.save();
        await receiverAccount.save();

        // 거래 기록 저장
        await Transaction.create({ account_id: senderAccount.id, amount: -amount, type: 'transfer_out' });
        await Transaction.create({ account_id: receiverAccount.id, amount, type: 'transfer_in' });

        res.json({ message: `${receiverUsername}님에게 ${amount}원을 송금했습니다.`, balance: senderAccount.balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
