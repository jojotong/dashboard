import axios from 'axios'

// 容器组列表
export const getPodList = (clusterName, namespace, query = {}) =>
  axios(
    `proxy/cluster/${clusterName}/custom/core/v1/namespaces/${namespace}/pods`,
    {
      params: query,
    },
  )
// 容器组详情
export const getPodDetail = (clusterName, namespace, name, query = {}) =>
  axios(
    `proxy/cluster/${clusterName}/core/v1/namespaces/${namespace}/pods/${name}`,
    { params: query },
  )
// 删除容器组
export const deletePod = (clusterName, namespace, name) =>
  axios.delete(
    `proxy/cluster/${clusterName}/core/v1/namespaces/${namespace}/pods/${name}`,
  )
