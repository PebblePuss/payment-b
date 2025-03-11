const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');  // 비밀번호 암호화 라이브러리 추가

const corsOptions = {
    origin: 'http://localhost:3000', // 허용할 출처
    methods: 'GET,POST', // 허용할 HTTP 메서드
    allowedHeaders: 'Content-Type', // 허용할 헤더
    credentials: true, // 인증 정보 (쿠키 등) 허용
};

const app = express();
const port = 5000;

// CORS 미들웨어 설정
app.use(cors(corsOptions));

// JSON 바디 파서 설정
app.use(bodyParser.json());

const secretKey = 'your_secret_key';

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');  // Authorization 헤더에서 토큰 추출
    if (!token) {
        return res.status(403).json({ error: '토큰이 필요합니다.' });
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
        }
        req.user = user;  // JWT에서 추출한 사용자 정보 req.user에 추가
        next();
    });
};

// 사용자 등록 API
app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;

    const userQuery = 'INSERT INTO User (username, password, email) VALUES (?, ?, ?)';
    const resultQuery = 'SELECT id FROM User WHERE username = ?';  // 사용자 ID 조회 쿼리
    const accountQuery = 'INSERT INTO Account (user_id, balance) VALUES (?, ?)';

    try {
        // 데이터베이스 연결
        const conn = await pool.getConnection();

        // 사용자 정보 삽입 (비밀번호 해시화 없이 평문으로 저장)
        await conn.query(userQuery, [username, password, email]);

        // 사용자의 ID를 조회
        const [user] = await conn.query(resultQuery, [username]);

        // 계좌 정보 삽입
        const defaultBalance = 0;  // 기본 잔액 0

        // 계좌는 방금 생성된 사용자 ID를 사용하여 삽입
        await conn.query(accountQuery, [user.id, defaultBalance]);

        conn.release();

        // JWT 토큰 생성 (optional)
        const token = jwt.sign({ userId: user.id, username }, secretKey, { expiresIn: '1h' });

        // 성공 응답
        res.status(200).json({
            message: '사용자 등록 성공',
            userId: user.id,
            token: token,  // 로그인 시 사용할 JWT 토큰 반환
        });
    } catch (err) {
        console.error('사용자 등록 실패:', err);
        res.status(500).json({ message: '사용자 등록 실패', error: err.message });
    }
});

// 로그인 API
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM User WHERE username = ? AND password = ?';
    try {
        const conn = await pool.getConnection();
        const result = await conn.query(query, [username, password]);
        conn.release();

        if (result.length > 0) {
            const user = result[0];

            // JWT 토큰 발급 (user.id를 payload에 포함)
            const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });

            res.status(200).json({ message: '로그인 성공', token: token });
        } else {
            res.status(401).json({ error: '잘못된 사용자 이름 또는 비밀번호' });
        }
    } catch (err) {
        console.error('로그인 실패:', err);
        res.status(500).json({ error: '로그인 실패' });
    }
});

// 사용자 정보 조회 API
app.get('/api/user', authenticateJWT, async (req, res) => {
    const { userId } = req.user; // JWT에서 사용자 ID 추출 (userId는 JWT에 포함되어 있어야 합니다)

    const query = 'SELECT id, username, email, status FROM User WHERE id = ?';
    try {
        const conn = await pool.getConnection();
        const user = await conn.query(query, [userId]);
        conn.release();

        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
    } catch (err) {
        console.error('사용자 조회 실패:', err);
        res.status(500).json({ error: '사용자 조회 실패' });
    }
});

app.get('/api/account', authenticateJWT, async (req, res) => {
    const { userId } = req.user;  // JWT에서 추출한 사용자 ID

    const queryAccount = 'SELECT balance FROM Account WHERE user_id = ?';
    // 데이터베이스에서 사용자의 계좌 정보 조회
    try {
        const conn = await pool.getConnection();
        const rows = await conn.query(queryAccount, userId);
        conn.release();

        if (rows.length > 0) {
            return res.status(200).json({
                balance: rows[0].balance  // 첫 번째 결과에서 balance 값을 반환
            });
        } else {
            return res.status(404).json({ message: '계좌 정보가 없습니다.' });
        }
    } catch (err) {
        console.error('계좌 조회 실패:', err);
        return res.status(500).json({ message: '계좌 조회에 실패했습니다.' });
    }
});

// 모든 사용자 정보와 계좌 정보 조회 API
app.get('/api/users', authenticateJWT, async (req, res) => {
    const query = `SELECT u.id, u.username, u.email, u.status, a.balance FROM User u LEFT JOIN Account a ON u.id = a.user_id`; // 모든 사용자와 계좌 정보를 가져오는 쿼리

    try {
        const conn = await pool.getConnection();
        const users = await conn.query(query); // 사용자 목록과 계좌 정보 조회
        conn.release();

        if (users.length > 0) {
            res.status(200).json(users);  // 사용자 및 계좌 정보 반환
        } else {
            res.status(404).json({ error: '등록된 사용자가 없습니다.' });  // 사용자 정보가 없을 때
        }
    } catch (err) {
        console.error('사용자 조회 실패:', err);
        res.status(500).json({ error: '사용자 조회 실패' });
    }
});

app.post('/api/transfer', authenticateJWT, async (req, res) => {
    const { senderId, receiverId, amount } = req.body;

    if (!senderId || !receiverId || !amount || amount <= 0) {
        return res.status(400).json({ error: '송금 정보가 잘못되었습니다.' });
    }

    const getSenderBalanceQuery = 'SELECT balance FROM Account WHERE user_id = ?';
    const getReceiverBalanceQuery = 'SELECT balance FROM Account WHERE user_id = ?';
    const updateSenderBalanceQuery = 'UPDATE Account SET balance = balance - ? WHERE user_id = ?';
    const updateReceiverBalanceQuery = 'UPDATE Account SET balance = balance + ? WHERE user_id = ?';

    try {
        const conn = await pool.getConnection();

        // 송금자 계좌 잔액 조회
        const [senderAccount] = await conn.query(getSenderBalanceQuery, [senderId]);

        if (!senderAccount || senderAccount.balance < amount) {
            return res.status(400).json({ error: '잔액이 부족합니다.' });
        }

        // 수금자 계좌 잔액 조회
        const [receiverAccount] = await conn.query(getReceiverBalanceQuery, [receiverId]);

        if (!receiverAccount) {
            return res.status(404).json({ error: '수금자를 찾을 수 없습니다.' });
        }

        // 송금자 계좌 잔액 차감
        await conn.query(updateSenderBalanceQuery, [amount, senderId]);

        // 수금자 계좌 잔액 추가
        await conn.query(updateReceiverBalanceQuery, [amount, receiverId]);

        conn.release();

        res.status(200).json({ message: '송금이 완료되었습니다.' });
    } catch (err) {
        console.error('송금 처리 실패:', err);
        res.status(500).json({ error: '송금 처리 중 오류가 발생했습니다.' });
    }
});

// 기타 API들 (계좌 조회, 거래 내역 조회, 주문 API 등)

app.listen(port, () => {
    console.log(`서버가 ${port}번 포트에서 실행 중입니다.`);
});