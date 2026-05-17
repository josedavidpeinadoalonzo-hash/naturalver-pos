const store: Record<string, string> = {};

export const mockAsyncStorage = {
  getItem: vi.fn(async (key: string) => store[key] || null),
  setItem: vi.fn(async (key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn(async (key: string) => { delete store[key]; }),
  multiRemove: vi.fn(async (keys: string[]) => { keys.forEach(k => delete store[k]); }),
  clear: vi.fn(async () => { Object.keys(store).forEach(k => delete store[k]); }),
};

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: mockAsyncStorage,
}));

beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.clearAllMocks();
});
