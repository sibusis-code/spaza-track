// Firebase Database Service
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase-config.js';

class FirebaseService {
  constructor() {
    this.currentUser = null;
    this.currentShop = null;
  }

  setCurrentUser(user, shop) {
    this.currentUser = user;
    this.currentShop = shop;
  }

  // PRODUCTS
  async getProducts() {
    if (!this.currentShop) throw new Error('No shop selected');
    
    const q = query(
      collection(db, 'products'),
      where('shopId', '==', this.currentShop.id),
      orderBy('name')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async addProduct(product) {
    if (!this.currentShop) throw new Error('No shop selected');
    
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      shopId: this.currentShop.id,
      createdBy: this.currentUser.uid,
      createdAt: Timestamp.now()
    });
    
    return { id: docRef.id, ...product };
  }

  async updateProduct(productId, updates) {
    if (!this.currentShop) throw new Error('No shop selected');
    
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async deleteProduct(productId) {
    if (!this.currentShop) throw new Error('No shop selected');
    
    await deleteDoc(doc(db, 'products', productId));
  }

  // SALES
  async getSales(dateFilter = null) {
    if (!this.currentShop) throw new Error('No shop selected');
    
    let q = query(
      collection(db, 'sales'),
      where('shopId', '==', this.currentShop.id),
      orderBy('saleDate', 'desc')
    );

    if (dateFilter) {
      const startOfDay = new Date(dateFilter);
      const endOfDay = new Date(dateFilter);
      endOfDay.setHours(23, 59, 59, 999);
      
      q = query(
        collection(db, 'sales'),
        where('shopId', '==', this.currentShop.id),
        where('saleDate', '>=', Timestamp.fromDate(startOfDay)),
        where('saleDate', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('saleDate', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      saleDate: doc.data().saleDate?.toDate() || new Date()
    }));
  }

  async addSale(sale) {
    if (!this.currentShop) throw new Error('No shop selected');
    
    const docRef = await addDoc(collection(db, 'sales'), {
      ...sale,
      shopId: this.currentShop.id,
      employeeId: this.currentUser.uid,
      employeeName: this.currentUser.displayName || this.currentUser.email,
      saleDate: Timestamp.now()
    });
    
    return { id: docRef.id, ...sale };
  }

  // ACTIVITY LOGS
  async logActivity(action, details) {
    if (!this.currentShop) return;
    
    await addDoc(collection(db, 'activity_logs'), {
      userId: this.currentUser.uid,
      userName: this.currentUser.displayName || this.currentUser.email,
      action,
      details,
      shopId: this.currentShop.id,
      timestamp: Timestamp.now()
    });
  }

  async getActivityLogs(limitCount = 50) {
    if (!this.currentShop) throw new Error('No shop selected');
    
    const q = query(
      collection(db, 'activity_logs'),
      where('shopId', '==', this.currentShop.id),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));
  }

  // SHOPS
  async createShop(shopName) {
    const docRef = await addDoc(collection(db, 'shops'), {
      name: shopName,
      createdBy: this.currentUser.uid,
      createdAt: Timestamp.now(),
      adminUsers: [this.currentUser.uid]
    });
    
    return { id: docRef.id, name: shopName };
  }

  async getShops() {
    const q = query(
      collection(db, 'shops'),
      where('adminUsers', 'array-contains', this.currentUser.uid)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async joinShop(shopId, shopName) {
    // Find shop by ID or name
    let q;
    if (shopId) {
      q = query(collection(db, 'shops'), where('__name__', '==', shopId));
    } else {
      q = query(collection(db, 'shops'), where('name', '==', shopName));
    }
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error('Shop not found');
    }
    
    const shop = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    };
    
    // Add user to shop's employees (optional - you might want admin approval)
    const shopRef = doc(db, 'shops', shop.id);
    await updateDoc(shopRef, {
      employees: [...(shop.employees || []), this.currentUser.uid]
    });
    
    return shop;
  }

  // REAL-TIME LISTENERS
  onProductsChange(callback) {
    if (!this.currentShop) return () => {};
    
    const q = query(
      collection(db, 'products'),
      where('shopId', '==', this.currentShop.id),
      orderBy('name')
    );
    
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(products);
    });
  }

  onSalesChange(callback) {
    if (!this.currentShop) return () => {};
    
    const q = query(
      collection(db, 'sales'),
      where('shopId', '==', this.currentShop.id),
      orderBy('saleDate', 'desc'),
      limit(100)
    );
    
    return onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        saleDate: doc.data().saleDate?.toDate() || new Date()
      }));
      callback(sales);
    });
  }
}

export default new FirebaseService();