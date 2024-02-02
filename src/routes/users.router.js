import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 1. `email`, `password`, `name`, `age`, `gender`, `profileImage`를 **body**로 전달받습니다.
// 2. 동일한 `email`을 가진 사용자가 있는지 확인합니다.
// 3. **Users**테이블에 `email`, `password`를 이용해 사용자를 생성합니다.
// 4. **UserInfos** 테이블에 `name`, `age`, `gender`, `proifileImage`를 이용해 사용자 정보를 생성합니다.

router.post("/sign-up", async (req, res, next) => {

    try{

        throw new Error("에러 핸들링 미들웨어 테스트 에러");
    
    const { email, password, name, age, gender, proifileImage } = req.body;

    const isExitUser = await prisma.users.findFirst({
      where: { email },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (isExitUser) {
      return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
    }

    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
      }
    });

    const userInfo = await prisma.userInfos.create({
      data: {
        userId: user.userId,
        name,
        age,
        gender,
        profileImage,
      },
    });

    return res.status(201).json({ message: "회원가입이 완료되었습니다." });
    } catch (err) {
        next(err);
    }
});

// 1. `email`, `password`를 body로 전달받습니다.
// 2. 전달 받은 `email`에 해당하는 사용자가 있는지 확인합니다.
// 3. 전달 받은 `password`의 데이터베이스의 저장된 `password`를 bcrypt를 이용해 검증합니다.
// 4. 로그인에 성공한다면, 사용자에게 JWT를 발급합니다.

router.post("/sign-in", async (req, res, next) => {
  const { email, password } = req.body;

  const user = await prisma.users.findFirst({ where: { email } });

  if (!user)
    return res.status(401).json({ message: "존재하지 않는 이메일입니다." });
  if (!(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });

  const token = jwt.sign({ userId: user.userId }, "custom-seceret-key");

  res.cookie("authorization", `Bearer ${token}`);
  return res.status(200).json({ message: "로그인에 성공하였습니다." });
});

// 1. 클라이언트가 로그인된 사용자인지 검증 합니다. -> 사용자 인증 미들웨어로 위임
// 2. 사용자를 조회할 때, 1:1 관계를 맺고 있는 UsersInfos 테이블을 조횧반디ㅏ.
// 3. 조회한 사용자의 상세한 정보를 클라이언트에게 반환합니다.
router.get("/users", authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  const user = await prisma.users.findFirst({
    where: { userId: +userId },
    select: {
      userId: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      userInfos: {
        select: {
          name: true,
          age: true,
          gender: true,
          profileImage: true,
        },
      },
    },
  });

  return res.status(200).json({ data: user });
});

export default router;
