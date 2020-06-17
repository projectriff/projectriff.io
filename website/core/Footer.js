/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

class Footer extends React.Component {
  docUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    const docsUrl = this.props.config.docsUrl;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    return `${baseUrl}${docsPart}${langPart}${doc}`;
  }

  pageUrl(doc, language) {
    const baseUrl = this.props.config.baseUrl;
    return baseUrl + (language ? `${language}/` : '') + doc;
  }

  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
                width="66"
                height="58"
              />
            )}
          </a>
          <div>
            <h5>Docs</h5>
            <a href={this.docUrl('')}>
              Versions
            </a>
          </div>
          <div>
            <h5>Community</h5>
            <a href={`${this.props.config.baseUrl}blog`}>Blog</a>
            <a href="https://github.com/projectriff/">GitHub</a>
            <a href="https://slack.projectriff.io">Slack</a>
            <a href="https://knative.dev/" target="_blank" rel="noopener">Knative</a>
            <a
              href="https://twitter.com/projectriff"
              target="_blank"
              rel="noreferrer noopener">
              Twitter
            </a>
          </div>
          <div>
            <h5>More</h5>
            <a href="https://www.vmware.com/help/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>
            <a href="https://www.vmware.com/help/legal.html" target="_blank" rel="noopener">Terms of Use</a>
            <a href="https://github.com/projectriff/riff/blob/main/CODE_OF_CONDUCT.adoc" target="_blank" rel="noopener">Code of Conduct</a>
          </div>
        </section>
        <section className="copyright">
          <a href="https://www.netlify.com">Deployed by Netlify</a>
        </section>
        <section className="copyright">
          Copyright © {new Date().getFullYear()} VMware, Inc
        </section>
      </footer>
    );
  }
}

module.exports = Footer;
