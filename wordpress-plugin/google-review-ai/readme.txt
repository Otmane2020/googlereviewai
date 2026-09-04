=== Google Review AI for WordPress ===
Contributors: googlereviewai
Tags: google reviews, business profile, ai replies, openrouter
Requires at least: 6.2
Requires PHP: 8.0
Stable tag: 0.1.0
License: GPLv2 or later

Connect Google Business Profile to WordPress, sync reviews, generate AI replies, and publish responses back to Google.

== Features ==
* Google OAuth 2.0 with the business.manage scope.
* Business Profile account/location discovery.
* Review sync into WordPress.
* French/English AI replies through OpenRouter.
* Manual Generate + Publish actions.
* Optional automatic generation/publication every 15 minutes.
* Minimum rating, tone, signature and reply delay settings.

== Installation on o2switch / cPanel ==
1. Install WordPress on your o2switch account.
2. Upload the plugin ZIP from WordPress > Plugins > Add Plugin > Upload Plugin.
3. Activate Google Review AI for WordPress.
4. Open Review AI > Settings.
5. In Google Cloud create an OAuth Web application and enable the Google Business Profile APIs needed by your project.
6. Add the Redirect URI displayed by the plugin to the OAuth client's Authorized redirect URIs.
7. Enter the Google Client ID, Google Client Secret and OpenRouter API key.
8. Connect Google Business Profile, choose a location, then sync reviews.

== Reliable cron on o2switch ==
The plugin registers a WP-Cron job every 15 minutes. For more reliable automation, add a real cPanel cron job, for example:

*/5 * * * * wget -qO /dev/null "https://YOUR-DOMAIN.TLD/wp-cron.php?doing_wp_cron"

You can also use o2switch WPTiger's WordPress cron optimization.

== Optional secrets in wp-config.php ==
define('GRAI_GOOGLE_CLIENT_ID', '...');
define('GRAI_GOOGLE_CLIENT_SECRET', '...');
define('GRAI_OPENROUTER_API_KEY', '...');

Google Business Profile API access and OAuth consent configuration are required. The connected Google account must manage the Business Profile location.
