// models/Product.ts
import { Schema, model, models } from 'mongoose';

interface IUser {
    username: string;
    password: string;
    balance: number;

}

const UserSchema = new Schema<IUser>({
  username:     { type: String,  required: true },
  password: { type: String,  required: true },
  balance:  { type: Number, default: 500  },
});

export const User = models.User ?? model<IUser>('User', UserSchema);