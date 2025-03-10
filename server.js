require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

// 📌 라우터 불러오기
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const transactionRoutes = require('./routes/transaction');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// 📌 미들웨어 설정
app.use(cors());
app.use(express.json());

// 📌 API 라우터 등록
app.use('/api/auth', authRoutes);         // 회원가입, 로그인, 로그아웃
app.use('/api/account', accountRoutes);   // 계좌 생성 및 잔액 조회
app.use('/api/transaction', transactionRoutes); // 송금, 입금 API
app.use('/api/shop', shopRoutes);         // 상품 조회 및 구매
app.use('/api/admin', adminRoutes);       // 관리자 기능 (회원 삭제, 잔액 수정)

// 📌 데이터베이스 연결 확인
sequelize.sync({ force: false }) // true로 설정하면 기존 데이터 삭제됨
    .then(() => console.log('✅ 데이터베이스 연결 성공'))
    .catch((err) => console.error('❌ 데이터베이스 연결 실패:', err));

// 📌 서버 실행
app.listen(PORT, () => console.log(`🚀 서버 실행 중: http://localhost:${PORT}`));
