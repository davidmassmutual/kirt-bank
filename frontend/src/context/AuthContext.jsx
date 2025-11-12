const fetchUser = async () => {
  const res = await axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  setUser(res.data);
};