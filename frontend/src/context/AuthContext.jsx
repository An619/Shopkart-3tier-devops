import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import authService from '../services/authService.js';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../config/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

 
