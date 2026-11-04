export function PluginSteps({ open = false }: { open?: boolean }) {
	return (
		<details className="setup" open={open}>
			<summary>How to add the plugin to your app</summary>
			<ol>
				<li>Copy <span className="mono">plugin/admin-hub.ts</span> from the admin-hub repo into your app, next to your <span className="mono">auth.ts</span>.</li>
				<li>
					Add it to your Better Auth plugins:
					<pre className="mono">{`import { adminHub } from "./admin-hub";\n\nplugins: [\n  // ...your plugins\n  adminHub({ key: process.env.ADMIN_HUB_KEY }),\n]`}</pre>
				</li>
				<li>Set <span className="mono">ADMIN_HUB_KEY</span> in the app's env to a random value (<span className="mono">openssl rand -base64 32</span>), deploy, and paste the same value here.</li>
			</ol>
		</details>
	);
}
