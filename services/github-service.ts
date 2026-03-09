export class GitHubService {
    private readonly token: string;
    private readonly owner: string;

    constructor(token: string, owner: string) {
        this.token = token;
        this.owner = owner;
    }

    private async request(path: string, options: RequestInit = {}) {
        const response = await fetch(`https://api.github.com${path}`, {
            ...options,
            headers: {
                Authorization: `token ${this.token}`,
                Accept: 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`GitHub API Error: ${error.message || response.statusText}`);
        }

        return response.json().catch(() => ({}));
    }

    async createRepository(name: string, description: string) {
        // Attempt to create in organization first, fallback to user if owner is not an org
        try {
            return await this.request(`/orgs/${this.owner}/repos`, {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    description,
                    private: true,
                    auto_init: true,
                }),
            });
        } catch (e: any) {
            if (e.message.includes('Not Found')) {
                return await this.request('/user/repos', {
                    method: 'POST',
                    body: JSON.stringify({
                        name,
                        description,
                        private: true,
                        auto_init: true,
                    }),
                });
            }
            throw e;
        }
    }

    async addCollaborator(repoFullName: string, username: string) {
        return await this.request(`/repos/${repoFullName}/collaborators/${username}`, {
            method: 'PUT',
            body: JSON.stringify({ permission: 'push' }),
        });
    }
}
