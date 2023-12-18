#!/usr/bin/env node

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';

import { parse } from 'marked';
import { XMLBuilder } from 'fast-xml-parser';

const SITE_HOST = 'https://josepedrodias.com';
//const SITE_HOST = 'http://127.0.0.1:8080';

const BLOG_ROOT = `${SITE_HOST}/posts`;
const FEED_URL = `${BLOG_ROOT}/feed.xml`;

const TPL = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>{TITLE}</title>
    <meta name="viewport" content="width=device-width, initial-scale=0.8" />
    <link rel="icon" href="data:,">
    <link rel="stylesheet" href="/main.css">
    <link rel="alternate" type="application/rss+xml" href="${FEED_URL}" />
  </head>
  <body class="blog">
{BODY}  </body>
</html>
`;

// https://github.com/NaturalIntelligence/fast-xml-parser/blob/HEAD/docs/v4/3.XMLBuilder.md
const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    attributeNamePrefix: '_',
    textNodeName: '_t',
    commentPropName: 'comment',
});

// https://www.rssboard.org/rss-specification
// https://www.rssboard.org/files/sample-rss-2.xml
const feed = {
    rss: {
        '_xmlns:atom': 'http://www.w3.org/2005/Atom',
        _version: '2.0',
        channel: {
            title: 'josepedrodias.com',
            description: '',
            language: 'en-us',
            link: BLOG_ROOT,
            'atom:link': {
                _rel: 'self',
                _href: FEED_URL,
                _type: 'application/rss+xml'
            },
            item: [],
        }
    },
};

const dirContents = await readdir('.');
const entries = dirContents.filter(fn => fn.indexOf('.md') !== -1);
entries.reverse();
// console.log('entries', entries);

for (const mdFn of entries) {
    const fnWoExt = mdFn.substring(0, mdFn.lastIndexOf('.md'));
    const htmlFn = `${fnWoExt}.html`;
    const postUrl = `${BLOG_ROOT}/${htmlFn}`;
    let markdownContent = (await readFile(mdFn)).toString();
    markdownContent = markdownContent.replace(/\{SITE_HOST\}/g, SITE_HOST);
    const postTitle = markdownContent.split('\n')[0].substring(1).trim();
    const htmlContent = TPL
        .replace('{TITLE}', `${postTitle} - josé pedro dias`)
        .replace(`{BODY}`, parse(markdownContent));
    await writeFile(htmlFn, htmlContent);

    //const fnStats = await stat(mdFn); console.log(mdFn, fnStats);
    feed.rss.channel.item.push({
        title: postTitle,
        link: postUrl,
        //pubDate: fnStats.ctime.toUTCString(),
        pubDate: new Date(fnWoExt).toUTCString(),
        guid: {
            _isPermaLink: false,
            _t: fnWoExt,
        },
        comment: fnWoExt,
    });
}

{
    const htmlFn = 'index.html';
    let markdownContent = `# Posts:
${feed.rss.channel.item.map(({ title, link, comment }) => `- [${comment} - ${title}](${link})`).join('\n')}
`;
    const postTitle = markdownContent.split('\n')[0].substring(1).trim();
    const htmlContent = TPL
        .replace('{TITLE}', `${postTitle} - josé pedro dias`)
        .replace(`{BODY}`, parse(markdownContent));
    await writeFile(htmlFn, htmlContent);
}

const xml = builder.build(feed);
await writeFile('feed.xml', xml);
