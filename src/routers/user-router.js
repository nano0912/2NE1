import { Router } from 'express';
import is from '@sindresorhus/is';
// 폴더에서 import하면, 자동으로 폴더의 index.js에서 가져옴
import {
  loginRequired,
  validCallNumberCheck,
  validEmailCheck,
} from '../middlewares';
import { userService } from '../services';
import { userModel } from '../db';
import { orderService } from '../services/order-service';
const userRouter = Router();
const asyncHandler = require('../utils/async-handler');
import {mail} from "../routers/mail";
userRouter.post(
  '/register',
  validEmailCheck, mail,
  asyncHandler(async (req, res, next) => {
    if (is.emptyObject(req.body)) {
      throw new Error(
        'headers의 Content-Type을 application/json으로 설정해주세요',
      );
    }

    const { fullName, email, password, role } = req.body;
console.log(req.authNum);
    //if (authNum == )

    // 위 데이터를 유저 db에 추가하기
    const newUser = await userService.addUser({
      fullName,
      email,
      password,
      role,
    });

    res.status(201).json(newUser);
  }),
);

userRouter.post('/login', async function (req, res, next) {
  try {
    if (is.emptyObject(req.body)) {
      throw new Error(
        'headers의 Content-Type을 application/json으로 설정해주세요',
      );
    }

    const { email, password } = req.body;

    // 로그인 진행 (로그인 성공 시 jwt 토큰을 프론트에 보내 줌)
    const userToken = await userService.getUserToken({ email, password });

    // jwt 토큰을 프론트에 보냄 (jwt 토큰은, 문자열임)
    res.status(200).json(userToken);
  } catch (error) {
    next(error);
  }
});

// 전체 유저 목록을 가져옴 (배열 형태임) // 관리자만 접근 가능
userRouter.get(
  '/userlist',
  loginRequired,
  asyncHandler(async function (req, res, next) {
    if (req.role === 0) {
      throw new Error('관리자만 회원 리스트를 볼 수 있습니다.');
    }

    const users = await userService.getUsers();

    res.status(200).json(users);
  }),
);

// 사용자 정보 수정
userRouter.patch(
  '/users/:userId',
  loginRequired,
  validCallNumberCheck,
  async function (req, res, next) {
    try {
      if (is.emptyObject(req.body)) {
        throw new Error(
          'headers의 Content-Type을 application/json으로 설정해주세요',
        );
      }
      const { userId } = req.params;

      const { fullName, address, phoneNumber, currentPassword } = req.body;

      // currentPassword 없을 시, 진행 불가
      if (!currentPassword) {
        throw new Error('정보를 변경하려면, 현재의 비밀번호가 필요합니다.');
      }

      const userInfoRequired = { userId, currentPassword };

      // 위 데이터가 undefined가 아니라면, 즉, 프론트에서 업데이트를 위해
      // 보내주었다면, 업데이트용 객체에 삽입함.
      const toUpdate = {
        ...(fullName && { fullName }),
        ...(address && { address }),
        ...(phoneNumber && { phoneNumber }),
      };

      const updatedUserInfo = await userService.setUser(
        userInfoRequired,
        toUpdate,
      );

      res.status(200).json(updatedUserInfo);
    } catch (error) {
      next(error);
    }
  },
);

// 사용자 정보 조회 (자신의 정보를 볼 수 있다.)
// 토큰을 가지고 있어야 함
userRouter.get(
  '/user',
  loginRequired,
  asyncHandler(async (req, res) => {
    const userId = req.currentUserId;
    const userInfo = await userModel.findById({ _id: userId });
    res.status(200).json(userInfo);
  }),
);

userRouter.patch(
  '/user/drop',
  loginRequired,
  asyncHandler(async (req, res) => {
    const userId = req.currentUserId;
    const { currentPassword } = req.body;
    if (!currentPassword) {
      throw new Error('정보를 변경하려면, 현재의 비밀번호가 필요합니다.');
    }

    const hasOrder = await orderService.hasOrder(userId);
    if (hasOrder) {
      throw new Error('주문 중인 정보가 있으므로 탈퇴가 불가능합니다.');
    }

    const userInfoRequired = { userId, currentPassword };

    const toUpdate = {
      status: 0,
    };
    const updatedUserInfo = await userService.setUser(
      userInfoRequired,
      toUpdate,
    );
    res.status(200).json(updatedUserInfo);
  }),
);
export { userRouter };
