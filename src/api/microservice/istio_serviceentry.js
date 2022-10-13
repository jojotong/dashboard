import axios from 'axios';

import { getApiVersion } from '@/utils/helpers';

// 服务入口列表
export const getIstioServiceEntryList = (clusterName, namespace, query = {}) => {
  const apiVersion = getApiVersion('serviceentry', 'networking.istio.io/v1beta1');
  return axios(`proxy/cluster/${clusterName}/${apiVersion}/namespaces/${namespace}/serviceentry`, {
    params: query,
  });
};
// 服务入口详情
export const getIstioServiceEntryDetail = (clusterName, namespace, name) => {
  const apiVersion = getApiVersion('serviceentry', 'networking.istio.io/v1beta1');
  return axios(`proxy/cluster/${clusterName}/${apiVersion}/namespaces/${namespace}/serviceentry/${name}`);
};
// 添加服务入口
export const postAddIstioServiceEntry = (clusterName, namespace, name, body = {}) => {
  const apiVersion = getApiVersion('serviceentry', 'networking.istio.io/v1beta1');
  return axios.post(`proxy/cluster/${clusterName}/${apiVersion}/namespaces/${namespace}/serviceentry/${name}`, body);
};
// 更新服务入口
export const patchUpdateIstioServiceEntry = (clusterName, namespace, name, body = {}) => {
  const apiVersion = getApiVersion('serviceentry', 'networking.istio.io/v1beta1');
  return axios.patch(`proxy/cluster/${clusterName}/${apiVersion}/namespaces/${namespace}/serviceentry/${name}`, body);
};
// 删除服务入口
export const deleteIstioServiceEntry = (clusterName, namespace, name) => {
  const apiVersion = getApiVersion('serviceentry', 'networking.istio.io/v1beta1');
  return axios.delete(`proxy/cluster/${clusterName}/${apiVersion}/namespaces/${namespace}/serviceentry/${name}`);
};
