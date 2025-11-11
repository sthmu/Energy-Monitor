const { db } = require('../config/firebase');

// Users collection reference
const usersCollection = db.collection('users');

// User model functions
const User = {
  // Create a new user
  async create(userData) {
    const userRef = usersCollection.doc();
    await userRef.set({
      ...userData,
      createdAt: new Date(),
    });
    return { id: userRef.id, ...userData };
  },

  // Find user by email
  async findByEmail(email) {
    const snapshot = await usersCollection.where('email', '==', email.toLowerCase()).limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },

  // Find user by ID
  async findById(userId) {
    const doc = await usersCollection.doc(userId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  // Update user
  async update(userId, updates) {
    await usersCollection.doc(userId).update(updates);
    return await User.findById(userId);
  },

  // Delete user
  async delete(userId) {
    await usersCollection.doc(userId).delete();
  }
};

module.exports = User;