((root, factory) => {
  if (typeof define === 'function' && define.amd) define(['react'], factory);
  else if (typeof exports !== 'undefined') {
    module.exports = factory(require('react'));
  } else root.FormattedText = factory(root.React);
})(this, React => {
  'use strict';

  const PARAGRAPH_SPLIT = /\n{2,}/;

  const LINE_SPLIT = /\n/;

  const LINK = new RegExp(

    // Group 1: Option 1, protocol specified
    '([a-z]+://\\S+)' +

    // OR
    '|' +

    // Group 2: Option 2, TLD specified
    // Group 3: Pre-TLD section
    '((\\S+?)\\.[a-z-]{2,63}\\S*)',
    'gi'
  );

  const DEFAULT_PROTOCOL = 'http://';

  const TERMINATORS = {
    '.': true
  };

  const WRAPPERS = {
    '(': ')',
    '[': ']',
    '"': '"',
    "'": "'",
    '<': '>'
  };

  const unwrap = (text, index) => {
    const [first, last] = [text[0], text[text.length - 1]];
    if (TERMINATORS[last]) return unwrap(text.slice(0, -1), index);
    if (WRAPPERS[first] === last) return unwrap(text.slice(1, -1), index + 1);
    return [text, index];
  };

  const getLinks = text => {
    const links = [];
    let match;
    while (match = LINK.exec(text)) {
      let [all, protocol, tld, preTld] = match;

      // To qualify as a link, either the protocol or TLD must be specified.
      if (!protocol && !tld) continue;

      let {index} = match;
      [all, index] = unwrap(all, index);
      links.push({
        index,
        text: all,
        url:
          protocol ? all :
          preTld.indexOf('@') !== -1 ? `mailto:${all}` :
          DEFAULT_PROTOCOL + all
      });
    }
    return links;
  };

  const renderText = (text, key) => {
    if (text) return <span key={key}>{text}</span>;
  };

  const renderLink = (link, key) => {
    return <a key={key} href={link.url}>{link.text}</a>;
  };

  const renderLinks = (text, key) => {
    const links = getLinks(text);
    if (!links.length) return text;
    const {length} = links;
    return links.reduce((parts, link, i) => {
      const from = link.index;
      const to = from + link.text.length;
      return {
        index: to,
        components: parts.components.concat(
          renderText(text.slice(parts.index, from), `${key}-${i * 2}`),
          renderLink(link, `${key}-${(i * 2) + 1}`),
          i === length - 1 ?
          renderText(text.slice(to), `${key}-${length * 2}`) :
          null
        )
      };
    }, {index: 0, components: []}).components;
  };

  const renderParagraph = text => {
    const lines = text.trim().split(LINE_SPLIT);
    return lines.reduce((paragraph, line, i) => paragraph.concat(
      renderLinks(line, i * 2),
      i === lines.length - 1 ? null : <br key={(i * 2) + 1} />
    ), []);
  };

  const renderParagraphs = text => {
    const paragraphs = text.trim().split(PARAGRAPH_SPLIT);
    return paragraphs.map((paragraph, i) =>
      paragraph ? <p key={i}>{renderParagraph(paragraph)}</p> : null
    );
  };

  return React.createClass({
    render() {
      const text = this.props.children || '';
      return <div>{renderParagraphs(text)}</div>;
    }
  });
});
