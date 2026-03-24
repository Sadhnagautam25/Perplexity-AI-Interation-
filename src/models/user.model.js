import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// create user schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    profile: {
      type: String, // profile image URL
      default:
        "https://ik.imagekit.io/habrddp30/default%20image.avif?updatedAt=1770870508311",
    },

    bio: {
      type: String,
      default: "",
      maxlength: 200,
    },

    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// PRE middleware (hash password before save)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// POST middleware (after save)
userSchema.post("save", function (doc) {
  console.log(`New user created: ${doc.email}`);
});

// Password verification method
userSchema.methods.verifyPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// create user model
const userModel = mongoose.model("User", userSchema);

export default userModel;
