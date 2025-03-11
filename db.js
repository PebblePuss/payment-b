const mariadb = require('mariadb');

// MariaDB 연결 설정
const pool = mariadb.createPool({
    host: 'localhost', // 데이터베이스 호스트
    user: 'root', // 데이터베이스 사용자 이름
    password: '1234', // 데이터베이스 비밀번호
    database: 'payment', // 사용할 데이터베이스
    connectionLimit: 5, // 연결 풀의 크기 설정
});

// 연결 테스트
pool.getConnection()
    .then(conn => {
        console.log('MariaDB 연결 성공');
        conn.release(); // 연결 반환
    })
    .catch(err => {
        console.error('MariaDB 연결 실패:', err);
    });

module.exports = pool;
