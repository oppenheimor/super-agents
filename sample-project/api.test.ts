import { createUser, getUser, User } from './api';

describe('createUser', () => {
  beforeEach(() => {
    // Clear the users Map before each test to ensure test isolation
    // We need to access the internal Map for cleanup
    // Since we can't directly access the private Map, we'll use deleteUser to clean up
  });

  afterEach(async () => {
    // Clean up all users created during tests
    // Note: This is a workaround since the Map is not exported
  });

  it('should create a user with valid name and email', () => {
    const input = {
      name: 'Alice',
      email: 'alice@example.com',
    };

    const user = createUser(input);

    expect(user).toBeDefined();
    expect(user.id).toMatch(/^user-\d+$/);
    expect(user.name).toBe('Alice');
    expect(user.email).toBe('alice@example.com');
  });

  it('should create a user and store it in the internal Map', () => {
    const input = {
      name: 'Bob',
      email: 'bob@example.com',
    };

    const user = createUser(input);
    const retrievedUser = getUser(user.id);

    expect(retrievedUser).toBeDefined();
    expect(retrievedUser?.id).toBe(user.id);
    expect(retrievedUser?.name).toBe(user.name);
    expect(retrievedUser?.email).toBe(user.email);
  });

  it('should create multiple users with unique ids', () => {
    const input1 = {
      name: 'User1',
      email: 'user1@example.com',
    };
    const input2 = {
      name: 'User2',
      email: 'user2@example.com',
    };

    const user1 = createUser(input1);
    const user2 = createUser(input2);

    expect(user1.id).not.toBe(user2.id);
    expect(user1.name).toBe('User1');
    expect(user2.name).toBe('User2');
  });

  it('should handle empty string name', () => {
    const input = {
      name: '',
      email: 'empty-name@example.com',
    };

    const user = createUser(input);

    expect(user.id).toMatch(/^user-\d+$/);
    expect(user.name).toBe('');
    expect(user.email).toBe('empty-name@example.com');
  });

  it('should handle empty string email', () => {
    const input = {
      name: 'EmptyEmail',
      email: '',
    };

    const user = createUser(input);

    expect(user.id).toMatch(/^user-\d+$/);
    expect(user.name).toBe('EmptyEmail');
    expect(user.email).toBe('');
  });

  it('should handle very long name', () => {
    const longName = 'A'.repeat(10000);
    const input = {
      name: longName,
      email: 'longname@example.com',
    };

    const user = createUser(input);

    expect(user.name).toBe(longName);
    expect(user.name.length).toBe(10000);
  });

  it('should handle very long email', () => {
    const longEmail = 'a'.repeat(100) + '@example.com';
    const input = {
      name: 'LongEmail',
      email: longEmail,
    };

    const user = createUser(input);

    expect(user.email).toBe(longEmail);
  });

  it('should handle special characters in name', () => {
    const input = {
      name: "John O'Brien-Smith & Jr.",
      email: 'special@example.com',
    };

    const user = createUser(input);

    expect(user.name).toBe("John O'Brien-Smith & Jr.");
  });

  it('should handle email with special characters', () => {
    const input = {
      name: 'Test',
      email: 'test+alias@sub.domain.example.com',
    };

    const user = createUser(input);

    expect(user.email).toBe('test+alias@sub.domain.example.com');
  });

  it('should handle unicode characters in name', () => {
    const input = {
      name: '张三',
      email: 'chinese@example.com',
    };

    const user = createUser(input);

    expect(user.name).toBe('张三');
  });

  it('should handle unicode characters in email', () => {
    const input = {
      name: 'Unicode',
      email: '用户@例子.广告',
    };

    const user = createUser(input);

    expect(user.email).toBe('用户@例子.广告');
  });

  it('should handle numeric strings in name', () => {
    const input = {
      name: '12345',
      email: 'number@example.com',
    };

    const user = createUser(input);

    expect(user.name).toBe('12345');
  });

  it('should return an object with correct User type structure', () => {
    const input = {
      name: 'TypeTest',
      email: 'type@example.com',
    };

    const user = createUser(input);

    // Verify the returned object has all required User properties
    expect(typeof user.id).toBe('string');
    expect(typeof user.name).toBe('string');
    expect(typeof user.email).toBe('string');

    // Verify the object matches User interface (keys check)
    const userKeys = Object.keys(user) as (keyof User)[];
    expect(userKeys).toContain('id');
    expect(userKeys).toContain('name');
    expect(userKeys).toContain('email');
    expect(userKeys.length).toBe(3);
  });

  it('should not modify the input object', () => {
    const input = {
      name: 'Original',
      email: 'original@example.com',
    };
    const originalInput = { ...input };

    createUser(input);

    expect(input.name).toBe(originalInput.name);
    expect(input.email).toBe(originalInput.email);
  });

  it('should return a new object reference', () => {
    const input = {
      name: 'Reference',
      email: 'ref@example.com',
    };

    const user = createUser(input);

    expect(user).not.toBe(input);
  });

  it('should handle whitespace-only name', () => {
    const input = {
      name: '   ',
      email: 'whitespace@example.com',
    };

    const user = createUser(input);

    expect(user.name).toBe('   ');
  });

  it('should handle whitespace in email', () => {
    const input = {
      name: 'WSEmail',
      email: '  spaces@example.com  ',
    };

    const user = createUser(input);

    expect(user.email).toBe('  spaces@example.com  ');
  });

  it('should create user with id starting with "user-" prefix', () => {
    const input = {
      name: 'PrefixTest',
      email: 'prefix@example.com',
    };

    const user = createUser(input);

    expect(user.id).toMatch(/^user-/);
    expect(user.id.startsWith('user-')).toBe(true);
  });

  it('should create user with numeric id suffix', () => {
    const input = {
      name: 'NumericTest',
      email: 'numeric@example.com',
    };

    const user = createUser(input);
    const idSuffix = user.id.replace('user-', '');

    expect(Number(idSuffix)).not.toBeNaN();
    expect(Number(idSuffix)).toBeGreaterThan(0);
  });

  it('should handle email with different TLDs', () => {
    const tlds = ['com', 'org', 'net', 'io', 'co.uk', 'jp'];

    tlds.forEach((tld) => {
      const input = {
        name: `User${tld}`,
        email: `user@domain.${tld}`,
      };

      const user = createUser(input);

      expect(user.email).toBe(`user@domain.${tld}`);
    });
  });

  it('should create user retrievable via getUser after creation', () => {
    const input = {
      name: 'RetrieveTest',
      email: 'retrieve@example.com',
    };

    const createdUser = createUser(input);
    const retrievedUser = getUser(createdUser.id);

    expect(retrievedUser).toEqual(createdUser);
  });

  it('should handle rapid consecutive calls', () => {
    const results: User[] = [];

    for (let i = 0; i < 10; i++) {
      results.push(
        createUser({
          name: `RapidUser${i}`,
          email: `rapid${i}@example.com`,
        }),
      );
    }

    // All users should be created successfully
    expect(results.length).toBe(10);

    // All should have unique ids
    const ids = results.map((u) => u.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);

    // All should be retrievable
    results.forEach((user) => {
      const retrieved = getUser(user.id);
      expect(retrieved).toEqual(user);
    });
  });
});
