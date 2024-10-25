import * as core from '@actions/core';
import { array, object, string } from 'valibot';
const LinearChangesetSdkReleaseIssuesBody = object({
    projectId: string(),
    apps: array(object({
        appName: string(),
        issues: array(object({
            version: string(),
            issueId: string(),
            url: string()
        }))
    }))
});
export class LinearChangesetSdk {
    url;
    constructor(url) {
        this.url = url;
    }
    async releaseIssues(body) {
        core.info(`Sending release issues to ${this.url}/api/release/issues`);
        core.info(`Body: ${JSON.stringify(body)}`);
        await fetch(`${this.url}/api/release/issues`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    }
    async getTags() {
        core.info(`Fetching tags from ${this.url}/api/release/tags`);
        const response = await fetch(`${this.url}/api/release/tags`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const json = (await response.json());
        json.tags.forEach(tag => {
            core.info(`Found tag: ${tag}`);
        });
        return json.tags;
    }
}
