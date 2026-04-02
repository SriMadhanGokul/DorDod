const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const email = "doordo@email.com";
    const hash = await bcrypt.hash("DoRDo@123", 12);

    const existing = await mongoose.connection
      .collection("users")
      .findOne({ email });

    if (existing) {
      // User exists — just update role + password
      await mongoose.connection
        .collection("users")
        .updateOne(
          { email },
          { $set: { role: "admin", password: hash, hasPassword: true } },
        );
      console.log("✅ Existing user updated to admin!");
    } else {
      // User does not exist — create fresh admin
      await mongoose.connection.collection("users").insertOne({
        name: "DoR-DoD Admin",
        email,
        password: hash,
        hasPassword: true,
        isGoogleUser: false,
        role: "admin",
        suspended: false,
        firstName: "Admin",
        lastName: "",
        avatar: "",
        bio: "",
        subscription: "Pro",
        notifications: { email: true, push: false, weekly: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ Admin user created!");
    }

    console.log("📧 Email:    doordo@email.com");
    console.log("🔑 Password: DoRDo@123");
    console.log("🌐 Login at: http://localhost:8080/login");
    console.log("⚙️  Admin at: http://localhost:8080/admin");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
