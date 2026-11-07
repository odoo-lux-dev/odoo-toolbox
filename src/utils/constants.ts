const CHROME_STORAGE_FAVORITES_KEY = "starredProjects";
const CHROME_STORAGE_SETTINGS_KEY = "settings";
const CHROME_STORAGE_QUICK_DOMAINS_KEY = "quickDomains";

const ODOO_SH_PROJECTS_URL = "https://www.odoo.sh/project";
const odooShProjectUrl = (name: string) => `${ODOO_SH_PROJECTS_URL}/${name}`;

const GITHUB_REPO_URL = "https://github.com/odoo-lux-dev/odoo-toolbox";

/** http(s) URL with at least one dot. */
const URL_REGEX = /^https?:\/\/.*\..*/i;

/** Optional URL fields (task links): empty, or an http(s) URL. */
const isUrlOrEmpty = (value: string) => value === "" || URL_REGEX.test(value);

export {
  ODOO_SH_PROJECTS_URL,
  odooShProjectUrl,
  GITHUB_REPO_URL,
  isUrlOrEmpty,
  CHROME_STORAGE_FAVORITES_KEY,
  CHROME_STORAGE_QUICK_DOMAINS_KEY,
  CHROME_STORAGE_SETTINGS_KEY,
};
