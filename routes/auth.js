const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Account } = require('../models');

const router = express.Router();

// 🔹 회원가입 API
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 사용자 존재 여부 확인
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) return res.status(400).json({ message: "이미 존재하는 사용자입니다." });

        // 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 생성
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            status: true
        });

        // 계좌 생성 (기본 잔액 0원)
        await Account.create({ user_id: newUser.id });

        res.status(201).json({ message: "회원가입 성공!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// 🔹 로그인 API
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 사용자 조회
        const user = await User.findOne({ where: { username } });
        if (!user) return res.status(400).json({ message: "사용자를 찾을 수 없습니다." });

        // 비밀번호 비교
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

        // JWT 토큰 발급
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ token, message: "로그인 성공!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "서버 오류" });
    }
});

// 🔹 로그아웃 API (클라이언트 측에서 토큰 삭제)
router.post('/logout', (req, res) => {
    res.json({ message: "로그아웃 완료!" });
});

module.exports = router;
