import axios from 'axios'

// 配置列表
export const getConfigMapList = (clusterName, namespace, query = {}) =>
  axios(
    `proxy/cluster/${clusterName}/core/v1/namespaces/${namespace}/configmaps`,
    {
      params: query,
    },
  )
// 配置详情
export const getConfigMapDetail = (clusterName, namespace, name, query = {}) =>
  axios(
    `proxy/cluster/${clusterName}/core/v1/namespaces/${namespace}/configmaps/${name}`,
    {
      params: query,
    },
  )
// 添加配置
export const postAddConfigMap = (clusterName, namespace, name, body = {}) =>
  axios.post(
    `proxy/cluster/${clusterName}/core/v1/namespaces/${namespace}/configmaps/${name}`,
    body,
  )
// 更新配置
export const patchUpdateConfigMap = (clusterName, namespace, name, body = {}) =>
  axios.patch(
    `proxy/cluster/${clusterName}/core/v1/namespaces/${namespace}/configmaps/${name}`,
    body,
  )
// 删除配置
export const deleteConfigMap = (clusterName, namespace, name) =>
  axios.delete(
    `proxy/cluster/${clusterName}/core/v1/namespaces/${namespace}/configmaps/${name}`,
  )
