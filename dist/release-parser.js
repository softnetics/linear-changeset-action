export function parseRelease(body) {
    if (!body)
        return [];
    const IssueUrlPattern = /\(https:\/\/linear.app\/(?<workspace>\w+)\/issue\/(?<issue>.*)\/(?<title>.*)\)/g;
    const matchedIssueUrls = body.match(IssueUrlPattern);
    if (!matchedIssueUrls)
        return [];
    return matchedIssueUrls.map(url => {
        const IssueUrlPattern = /\(https:\/\/linear.app\/(?<workspace>\w+)\/issue\/(?<issue>.*)\/(?<title>.*)\)/g;
        const _url = url.slice(1, -1);
        const group = IssueUrlPattern.exec(url)?.groups;
        return {
            workspace: group?.workspace,
            issue: group?.issue,
            title: group?.title,
            url: _url
        };
    });
}
