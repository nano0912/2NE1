import { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    address: {
      type: new Schema(
        {
          postalCode: String,
          address1: String,
          address2: String,
        },
        {
          _id: false,
        }
      ),
      required: false,
    },
    role: {
      // 사용자 0 , 관리자 1
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

export { UserSchema };