// Firebase configuration and data models for future integration
// This file prepares the architecture for Firebase integration

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Firebase data models that match our current TypeScript types
export interface FirebaseAmbulance {
  id: string;
  vehicleId: string;
  status: "available" | "en_route" | "at_scene" | "transporting" | "out_of_service";
  location: {
    lat: number;
    lng: number;
    timestamp: number; // Firebase timestamp
  };
  equipmentLevel: "basic" | "advanced" | "critical";
  crewSize: number;
  lastUpdated: number;
  createdAt: number;
  updatedAt: number;
}

export interface FirebaseEmergencyCall {
  id: string;
  callerPhone?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  severityLevel: 1 | 2 | 3 | 4;
  callTime: number;
  status: "pending" | "assigned" | "en_route" | "completed" | "cancelled";
  assignedAmbulanceId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FirebaseDispatchRecord {
  id: string;
  callId: string;
  ambulanceId: string;
  dispatchTime: number;
  arrivalTime?: number;
  completionTime?: number;
  distanceTraveledKm?: number;
  responseTimeSeconds?: number;
  status?: "dispatched" | "arrived" | "completed";
  createdAt: number;
  updatedAt: number;
}

export interface FirebaseHospital {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  capacity: number;
  currentOccupancy: number;
  emergencyBeds: number;
  availableEmergencyBeds: number;
  specialties: string[];
  status: "operational" | "limited" | "closed";
  contactNumber: string;
  lastUpdated: number;
}

// Collection names for Firestore
export const FIREBASE_COLLECTIONS = {
  AMBULANCES: "ambulances",
  EMERGENCY_CALLS: "emergency_calls",
  DISPATCHES: "dispatches",
  HOSPITALS: "hospitals",
  USERS: "users",
  AUDIT_LOGS: "audit_logs"
} as const;

// Migration utilities for converting current data to Firebase format
export class FirebaseMigrationUtils {
  static convertAmbulanceToFirebase(ambulance: any): FirebaseAmbulance {
    const now = Date.now();
    return {
      id: ambulance.id.toString(),
      vehicleId: ambulance.vehicleId,
      status: ambulance.status,
      location: {
        lat: ambulance.location.lat,
        lng: ambulance.location.lng,
        timestamp: ambulance.lastUpdated || now
      },
      equipmentLevel: ambulance.equipmentLevel,
      crewSize: ambulance.crewSize,
      lastUpdated: ambulance.lastUpdated || now,
      createdAt: now,
      updatedAt: now
    };
  }

  static convertCallToFirebase(call: any): FirebaseEmergencyCall {
    const now = Date.now();
    return {
      id: call.id.toString(),
      callerPhone: call.callerPhone,
      location: {
        lat: call.location.lat,
        lng: call.location.lng,
        address: call.address
      },
      severityLevel: call.severityLevel,
      callTime: call.callTime || now,
      status: call.status,
      assignedAmbulanceId: call.assignedAmbulanceId?.toString(),
      createdAt: now,
      updatedAt: now
    };
  }

  static convertDispatchToFirebase(dispatch: any): FirebaseDispatchRecord {
    const now = Date.now();
    return {
      id: dispatch.id.toString(),
      callId: dispatch.callId.toString(),
      ambulanceId: dispatch.ambulanceId.toString(),
      dispatchTime: dispatch.dispatchTime || now,
      arrivalTime: dispatch.arrivalTime,
      completionTime: dispatch.completionTime,
      distanceTraveledKm: dispatch.distanceTraveledKm,
      responseTimeSeconds: dispatch.responseTimeSeconds,
      status: dispatch.status,
      createdAt: now,
      updatedAt: now
    };
  }
}

// Firebase service interface for future implementation
export interface FirebaseService {
  // Authentication
  signIn(email: string, password: string): Promise<any>;
  signOut(): Promise<void>;
  getCurrentUser(): any;

  // Ambulances
  getAmbulances(): Promise<FirebaseAmbulance[]>;
  addAmbulance(ambulance: Omit<FirebaseAmbulance, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  updateAmbulance(id: string, updates: Partial<FirebaseAmbulance>): Promise<void>;
  deleteAmbulance(id: string): Promise<void>;
  subscribeToAmbulances(callback: (ambulances: FirebaseAmbulance[]) => void): () => void;

  // Emergency Calls
  getCalls(): Promise<FirebaseEmergencyCall[]>;
  addCall(call: Omit<FirebaseEmergencyCall, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  updateCall(id: string, updates: Partial<FirebaseEmergencyCall>): Promise<void>;
  subscribeToCalls(callback: (calls: FirebaseEmergencyCall[]) => void): () => void;

  // Dispatches
  getDispatches(): Promise<FirebaseDispatchRecord[]>;
  addDispatch(dispatch: Omit<FirebaseDispatchRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  updateDispatch(id: string, updates: Partial<FirebaseDispatchRecord>): Promise<void>;
  subscribeToDispatches(callback: (dispatches: FirebaseDispatchRecord[]) => void): () => void;

  // Hospitals
  getHospitals(): Promise<FirebaseHospital[]>;
  updateHospital(id: string, updates: Partial<FirebaseHospital>): Promise<void>;
  subscribeToHospitals(callback: (hospitals: FirebaseHospital[]) => void): () => void;
}

// Security rules template for Firestore
export const FIRESTORE_SECURITY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Ambulances - read by authenticated users, write by admins
    match /ambulances/{ambulanceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin' || 
        request.auth.token.role == 'dispatcher';
    }
    
    // Emergency calls - read/write by authenticated users
    match /emergency_calls/{callId} {
      allow read, write: if request.auth != null;
    }
    
    // Dispatches - read/write by authenticated users
    match /dispatches/{dispatchId} {
      allow read, write: if request.auth != null;
    }
    
    // Hospitals - read by all, write by admins
    match /hospitals/{hospitalId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }
    
    // Users - users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Audit logs - read by admins only
    match /audit_logs/{logId} {
      allow read: if request.auth != null && request.auth.token.role == 'admin';
      allow write: if request.auth != null;
    }
  }
}
`;

// Environment configuration for Firebase
export const getFirebaseConfig = (): FirebaseConfig | null => {
  if (typeof window === 'undefined') return null;
  
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  };
};

// Migration plan documentation
export const FIREBASE_MIGRATION_PLAN = `
# Firebase Integration Migration Plan

## Phase 1: Setup and Configuration
1. Create Firebase project for Ghana EMS
2. Configure Firestore database with security rules
3. Set up Firebase Authentication with email/password and custom claims
4. Configure environment variables for Firebase config

## Phase 2: Data Migration
1. Export current in-memory data to JSON
2. Create Firebase collections with proper indexes
3. Migrate ambulances, calls, dispatches, and hospitals data
4. Implement real-time listeners for live updates

## Phase 3: Authentication Integration
1. Replace token-based auth with Firebase Authentication
2. Implement role-based access control (admin, dispatcher, crew)
3. Add user management interface for admins
4. Secure API routes with Firebase Admin SDK

## Phase 4: Real-time Features
1. Replace SSE with Firestore real-time listeners
2. Implement offline support with Firestore caching
3. Add push notifications for critical alerts
4. Implement audit logging for all actions

## Phase 5: Advanced Features
1. Add file storage for ambulance documents/photos
2. Implement backup and disaster recovery
3. Add analytics and reporting with Firebase Analytics
4. Scale with Firebase Functions for complex operations

## Environment Variables Needed:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- FIREBASE_ADMIN_SDK_KEY (server-side)
`;
