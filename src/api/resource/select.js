import axios from 'axios'

export const tenantUserSelectData = (tenantid, query = {}) =>
  axios(`tenant/${tenantid}/user`, {
    params: Object.assign(query, {
      size: 1000,
      noprocessing: true,
    }),
  })
export const tenantProjectSelectData = (tenantid, query = {}) =>
  axios(`tenant/${tenantid}/project`, {
    params: Object.assign(query, {
      size: 1000,
      preload: 'Tenant',
      noprocessing: true,
    }),
  })
export const projectEnvironmentSelectData = (projectid, query = {}) =>
  axios(`project/${projectid}/environment`, {
    params: Object.assign(query, {
      preload: 'Cluster',
      size: 1000,
      noprocessing: true,
    }),
  })
export const clusterSelectData = (query = {}) =>
  axios(`cluster`, {
    params: Object.assign(query, {
      size: 1000,
      noprocessing: true,
    }),
  })
export const namespaceSelectData = (clusterName, query = {}) =>
  axios(`proxy/cluster/${clusterName}/core/v1/namespaces`, {
    params: query,
    size: 1000,
    noprocessing: true,
  })
export const namespaceSelectDataFilter = (clusterName, query = {}) =>
  axios(`proxy/cluster/${clusterName}/custom/core/v1/namespaces`, {
    params: query,
    size: 1000,
    noprocessing: true,
  })

export const environmentSelectData = (query = {}) =>
  axios(`environment`, {
    params: Object.assign(query, {
      preload: 'Cluster',
      size: 1000,
      noprocessing: true,
    }),
  })
export const storageClassSelectData = (clusterName, query = {}) =>
  axios(`proxy/cluster/${clusterName}/storage.k8s.io/v1/storageclasses`, {
    params: Object.assign(query, { size: 1000, noprocessing: true }),
  })
export const secretSelectData = (clusterName, namespace, query = {}) =>
  axios(
    `proxy/cluster/${clusterName}/core/v1/namespaces/${namespace}/secrets`,
    {
      params: Object.assign(query, { size: 1000, noprocessing: true }),
    },
  )
export const serviceSelectData = (clusterName, namespace, query = {}) =>
  axios(
    `proxy/cluster/${clusterName}/core/v1/namespaces/${namespace}/services`,
    {
      params: Object.assign(query, { size: 1000, noprocessing: true }),
    },
  )
export const issuerSelectData = (clusterName, namespace, query = {}) =>
  axios(
    `proxy/cluster/${clusterName}/cert-manager.io/v1/namespaces/${namespace}/issuers`,
    {
      params: Object.assign(query, { size: 1000, noprocessing: true }),
    },
  )
export const gatewaySelectData = (tenantid, clusterid, query = {}) =>
  axios(`tenant/${tenantid}/cluster/${clusterid}/tenantgateways`, {
    params: Object.assign(query, { size: 1000, noprocessing: true }),
  })
export const projectSelectData = (query = {}) =>
  axios(`project`, {
    params: Object.assign(query, {
      size: 1000,
      preload: 'Tenant',
      noprocessing: true,
    }),
  })
export const projectRegistrySelectData = (projectid, query = {}) =>
  axios(`project/${projectid}/registry`, {
    params: Object.assign(query, { size: 1000, noprocessing: true }),
  })
export const registrySelectData = (query = {}) =>
  axios(`registry`, {
    params: Object.assign(query, { size: 1000, noprocessing: true }),
  })
export const appSelectData = (
  tenantid,
  projectid,
  environmentid,
  query = { size: 1000, noprocessing: true, kind: 'app' },
) =>
  axios(
    `tenant/${tenantid}/project/${projectid}/environment/${environmentid}/applications`,
    {
      params: query,
    },
  )
