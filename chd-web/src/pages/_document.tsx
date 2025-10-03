import { Html, Head, Main, NextScript } from 'next/document';

// Custom Document for Pages Router
// Note: Keep this minimal; heavy logic should live in _app.tsx
export default function Document() {
	return (
		<Html lang="en">
			<Head>
				{/* Place any global meta, preload links, or inline theme scripts here if needed */}
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}

