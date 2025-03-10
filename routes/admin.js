const express = require('express');
const { User, Account } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 🔹 관리자 권한 체크 미들웨어
const adminMiddleware = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "관리자 권한이 필요합니다." });
    }
    next();
};

// 🔹 회원 삭제 API
router.delete('/user/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

        await user.destroy();
        res.json({ message: "사용자가 삭제되었습니다." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// 🔹 회원 계좌 금액 수정 API
router.put('/user/:id/balance', authMiddleware, adminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { balance } = req.body;

    if (balance < 0) return res.status(400).json({ message: "잔액은 0 이상이어야 합니다." });

    try {
        const account = await Account.findOne({ where: { user_id: id } });
        if (!account) return res.status(404).json({ message: "계좌를 찾을 수 없습니다." });

        account.balance = balance;
        await account.save();

        res.json({ message: `사용자의 잔액이 ${balance}원으로 수정되었습니다.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
