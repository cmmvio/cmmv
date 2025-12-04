import { vi } from 'vitest';

/**
 * Mock Vault Service (AES-256-GCM & ECC encryption)
 */
export const MockVaultService = {
    // AES encryption
    encrypt: vi.fn().mockReturnValue('encrypted-data'),
    decrypt: vi.fn().mockReturnValue('decrypted-data'),
    encryptBuffer: vi.fn().mockReturnValue(Buffer.from('encrypted')),
    decryptBuffer: vi.fn().mockReturnValue(Buffer.from('decrypted')),

    // Key management
    generateKey: vi.fn().mockReturnValue('generated-key'),
    deriveKey: vi.fn().mockReturnValue('derived-key'),
    rotateKey: vi.fn().mockResolvedValue({ success: true }),

    // ECC operations
    generateKeyPair: vi.fn().mockReturnValue({
        publicKey: 'mock-public-key',
        privateKey: 'mock-private-key',
    }),
    sign: vi.fn().mockReturnValue('mock-signature'),
    verify: vi.fn().mockReturnValue(true),
    encryptWithPublicKey: vi.fn().mockReturnValue('encrypted-with-public'),
    decryptWithPrivateKey: vi.fn().mockReturnValue('decrypted-with-private'),

    // Hashing
    hash: vi.fn().mockReturnValue('hashed-value'),
    hashPassword: vi.fn().mockReturnValue('hashed-password'),
    verifyPassword: vi.fn().mockReturnValue(true),

    // Token operations
    generateToken: vi.fn().mockReturnValue('mock-token'),
    validateToken: vi.fn().mockReturnValue(true),

    reset: () => {
        Object.values(MockVaultService).forEach((mock) => {
            if (typeof mock === 'function' && 'mockReset' in mock) {
                (mock as any).mockReset();
            }
        });
    },
};

/**
 * Mock encryption result
 */
export interface MockEncryptionResult {
    ciphertext: string;
    iv: string;
    tag: string;
}

/**
 * Create mock encryption result
 */
export function createMockEncryptionResult(overrides: Partial<MockEncryptionResult> = {}): MockEncryptionResult {
    return {
        ciphertext: 'mock-ciphertext-' + Math.random().toString(36).substr(2, 16),
        iv: 'mock-iv-' + Math.random().toString(36).substr(2, 16),
        tag: 'mock-tag-' + Math.random().toString(36).substr(2, 16),
        ...overrides,
    };
}

/**
 * Mock key pair
 */
export interface MockKeyPair {
    publicKey: string;
    privateKey: string;
}

/**
 * Create mock key pair
 */
export function createMockKeyPair(): MockKeyPair {
    return {
        publicKey: '-----BEGIN PUBLIC KEY-----\nMOCK_PUBLIC_KEY\n-----END PUBLIC KEY-----',
        privateKey: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----',
    };
}

/**
 * Reset all Vault mocks
 */
export function resetAllVaultMocks() {
    MockVaultService.reset();
}
