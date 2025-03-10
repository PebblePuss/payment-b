const express = require('express');
const { Shop, OrderTable, Account } = require('../models');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// 🔹 모든 상품 조회
router.get('/', async (req, res) => {
    try {
        const items = await Shop.findAll();
        res.json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// 🔹 상품 구매 API
router.post('/purchase', authMiddleware, async (req, res) => {
    const { shopId, quantity } = req.body;
    const userId = req.user.userId;

    if (!shopId || quantity <= 0) return res.status(400).json({ message: "올바른 요청입니다." });

    try {
        // 상품 정보 가져오기
        const item = await Shop.findByPk(shopId);
        if (!item) return res.status(404).json({ message: "상품을 찾을 수 없습니다." });

        // 사용자 계좌 찾기
        const account = await Account.findOne({ where: { user_id: userId } });
        if (!account) return res.status(404).json({ message: "계좌를 찾을 수 없습니다." });

        const totalPrice = item.price * quantity;
        if (account.balance < totalPrice) return res.status(400).json({ message: "잔액이 부족합니다." });

        // 잔액 차감 및 저장
        account.balance -= totalPrice;
        await account.save();

        // 주문 정보 저장
        await OrderTable.create({
            user_id: userId,
            shop_id: shopId,
            account_id: account.id,
            quantity,
            total_price: totalPrice
        });

        res.json({ message: `${item.description} ${quantity}개를 구매했습니다.`, balance: account.balance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

module.exports = router;
