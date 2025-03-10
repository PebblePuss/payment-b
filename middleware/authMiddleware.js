const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "인증이 필요합니다." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // 사용자 정보 가져오기
        const user = await User.findByPk(decoded.userId);
        if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

        req.user.isAdmin = user.status; // status가 true면 관리자

        next();
    } catch (error) {
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};

module.exports = authMiddleware;
