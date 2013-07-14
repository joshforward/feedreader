<?xml version="1.0" encoding="UTF-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="html" />

<xsl:template match="/rss/channel">
		<header>
			<h1><xsl:value-of select="title"/></h1>
			<h2>
				<a>
					<xsl:attribute name="href">
						<xsl:value-of select="link"/>
					</xsl:attribute>
					<xsl:value-of select="link"/>
				</a>
			</h2>
			<xsl:if test="string-length(copyright)!=0">
				<small class="copyright">&#169; <xsl:value-of select="copyright"/></small>
			</xsl:if>
		</header>
		
		<main>
			<xsl:for-each select="item">
				<article>
					<xsl:attribute name="data-full-article-link">
						<xsl:value-of select="link"/>
					</xsl:attribute>
					<div class="article-container">
						<h3><xsl:value-of select="title"/></h3>
						<section>
						<p data-decode-html=""><xsl:value-of select="description" disable-output-escaping="yes"/></p>
						<a class="read-more">
							<xsl:attribute name="href">
								<xsl:value-of select="link"/>
							</xsl:attribute>
							Read More &#187;
						</a>
						</section>
					</div>
				</article>
			</xsl:for-each>
		</main>
</xsl:template>
</xsl:stylesheet>