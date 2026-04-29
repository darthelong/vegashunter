<?xml version="1.0" encoding="UTF-8"?>
<!--
  Sitemap stylesheet — purely cosmetic. Browsers (Firefox in particular)
  apply this XSLT and render the sitemap as a styled HTML document for
  humans. Search-engine crawlers ignore the stylesheet and parse the raw
  XML directly. Press Ledger v0.2 visual language.
-->
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                version="1.0">
  <xsl:output method="html" encoding="UTF-8" indent="yes"
              doctype-system="about:legacy-compat"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <meta name="robots" content="noindex"/>
        <title>VegasHunter — Sitemap</title>
        <style>
          @font-face {
            font-family: 'Gloock';
            src: url('/fonts/Gloock-Regular.woff') format('woff'),
                 url('/fonts/Gloock-Regular.ttf') format('truetype');
            font-display: swap;
          }
          @font-face {
            font-family: 'JetBrains Mono';
            src: url('/fonts/JetBrainsMono-Regular.woff') format('woff'),
                 url('/fonts/JetBrainsMono-Regular.ttf') format('truetype');
            font-display: swap;
          }
          @font-face {
            font-family: 'Bricolage Grotesque';
            src: url('/fonts/BricolageGrotesque-Regular.woff') format('woff'),
                 url('/fonts/BricolageGrotesque-Regular.ttf') format('truetype');
            font-display: swap;
          }
          :root { color-scheme: dark; }
          html, body {
            background: #0B0A10; color: #F4EFE2;
            font-family: 'Bricolage Grotesque', system-ui, sans-serif;
            margin: 0; padding: 0;
          }
          .wrap { max-width: 1100px; margin: 0 auto; padding: 56px 24px 96px; }
          header { border-bottom: 1px solid #2D2640; padding-bottom: 32px; margin-bottom: 32px; }
          .kicker {
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            text-transform: uppercase; letter-spacing: 0.18em;
            font-size: 12px; color: #B3AAC3; margin-bottom: 16px;
          }
          h1 {
            font-family: 'Gloock', Georgia, serif;
            font-weight: 400; font-size: 56px; line-height: 1.1;
            margin: 0 0 16px;
          }
          .tick {
            display: inline-block; width: 48px; height: 3px;
            background: #FF2D7A; margin: 12px 0 24px;
          }
          .meta {
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            font-size: 13px; color: #5F567A;
          }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          thead th {
            text-align: left; padding: 10px 12px;
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            text-transform: uppercase; letter-spacing: 0.18em;
            font-size: 11px; color: #5F567A; font-weight: 700;
            border-bottom: 1px solid #2D2640;
          }
          tbody td {
            padding: 12px; border-bottom: 1px solid #1F1A2A; vertical-align: top;
            font-size: 14px;
          }
          tbody tr:hover td { background: #14111C; }
          a { color: #F4EFE2; text-decoration: none; border-bottom: 1px solid #FF2D7A; }
          a:hover { background: rgba(255,45,122,0.08); }
          .num {
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            font-variant-numeric: tabular-nums; color: #B3AAC3;
            white-space: nowrap;
          }
          .alts { font-size: 12px; color: #5F567A; margin-top: 4px; }
          .alts code {
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            color: #B3AAC3;
          }
          footer {
            margin-top: 48px; padding-top: 24px; border-top: 1px solid #2D2640;
            font-family: 'JetBrains Mono', ui-monospace, monospace;
            font-size: 12px; color: #5F567A;
            text-transform: uppercase; letter-spacing: 0.18em;
            display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px;
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <div class="kicker">VEGASHUNTER · PRESS LEDGER · sitemap.xml</div>
            <h1>Sitemap</h1>
            <div class="tick"></div>
            <p class="meta">
              <xsl:value-of select="count(s:urlset/s:url)"/> URL · machine-readable XML for crawlers · this page is the human view (XSL stylesheet)
            </p>
          </header>

          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th style="width:120px">Last modified</th>
                <th style="width:90px">Priority</th>
                <th style="width:120px">Change freq.</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="s:urlset/s:url">
                <tr>
                  <td>
                    <a href="{s:loc}"><xsl:value-of select="s:loc"/></a>
                    <xsl:if test="xhtml:link">
                      <div class="alts">
                        alternates:
                        <xsl:for-each select="xhtml:link">
                          <code><xsl:value-of select="@hreflang"/></code><xsl:if test="position() != last()">, </xsl:if>
                        </xsl:for-each>
                      </div>
                    </xsl:if>
                  </td>
                  <td class="num"><xsl:value-of select="s:lastmod"/></td>
                  <td class="num"><xsl:value-of select="s:priority"/></td>
                  <td class="num"><xsl:value-of select="s:changefreq"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>

          <footer>
            <span>VH · sitemap.xml</span>
            <span>Press Ledger v0.2</span>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
