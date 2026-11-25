const ALL_ODOO_VERSIONS = ["18.0", "19.0", "20.0"];

export const ODOO_VERSIONS = process.env.E2E_ODOO_VERSIONS
  ? process.env.E2E_ODOO_VERSIONS.split(",")
  : ALL_ODOO_VERSIONS;

export const odooServer = (version: string) => {
  const major = Number.parseInt(version, 10);
  return {
    service: `odoo-${major}`,
    database: `odoo${major}`,
    port: 8000 + major,
    hostname: `odoo${major}.test`,
  };
};
