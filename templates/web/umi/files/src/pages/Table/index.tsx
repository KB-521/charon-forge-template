import type { ColumnsType } from 'antd/es/table'
import type { MetaSheetRef } from '@/components/MetaSheet'
import type { DemoRecord } from '@/services/demo'
import { PageContainer } from '@ant-design/pro-components'
import { Button, message, Space, Tag } from 'antd'
import { useMemo, useRef } from 'react'
import MetaSheet from '@/components/MetaSheet'
import { FILTER_TYPE } from '@/components/MetaSheet/constant'
import { useDictList } from '@/hooks/useDictList'
import { useExport } from '@/hooks/useExport'
import { exportRecords, queryRecords } from '@/services'

export default function TablePage() {
  const ref = useRef<MetaSheetRef>(null)
  const { dictOptions, dictMap } = useDictList('record-status')
  const { handleExport, loading } = useExport(
    { idList: [] as (string | number)[] },
    exportRecords,
  )
  const filters = useMemo(
    () => [
      {
        fieldName: 'name',
        type: FILTER_TYPE.INPUT,
        placeholder: '搜索项目名称',
      },
      {
        fieldName: 'status',
        type: FILTER_TYPE.SELECT,
        placeholder: '状态',
        available: dictOptions,
        width: 150,
      },
      {
        fieldName: 'createdAt',
        type: FILTER_TYPE.RANGE_DATE,
        placeholderList: ['开始时间', '结束时间'] as [string, string],
      },
    ],
    [dictOptions],
  )
  const columns = useMemo<ColumnsType<DemoRecord>>(
    () => [
      { title: '编号', dataIndex: 'id', width: 100, sorter: true },
      { title: '项目名称', dataIndex: 'name', width: 220, sorter: true },
      {
        title: '状态',
        dataIndex: 'status',
        width: 120,
        render: (value: string) => (
          <Tag color={value === 'active' ? 'green' : 'default'}>
            {dictMap[value] || value}
          </Tag>
        ),
      },
      { title: '创建时间', dataIndex: 'createdAt', width: 210, sorter: true },
    ],
    [dictMap],
  )
  return (
    <PageContainer title="数据列表" subTitle="筛选、排序、分页、选择与导出">
      <p className="page-intro">
        MetaSheet 延续来源组件的筛选与操作接口，替换 requestInterface
        即可接入业务。
      </p>
      <MetaSheet<DemoRecord>
        ref={ref}
        columns={columns}
        filters={filters}
        requestInterface={queryRecords}
        fixHeader={false}
        fixFooter={false}
        actionRender={({ selectedRowKeys, selectedRows, refreshSheet }) => (
          <Space style={{ marginBottom: 12 }} wrap>
            <Button
              type="primary"
              loading={loading}
              onClick={() =>
                handleExport({ idList: selectedRowKeys.map(String) })}
            >
              {selectedRowKeys.length ? '导出已选' : '导出全部'}
            </Button>
            <Button
              disabled={!selectedRowKeys.length}
              onClick={() =>
                message.info(`已选择 ${selectedRows.length} 条记录`)}
            >
              查看选择
            </Button>
            <Button onClick={refreshSheet}>刷新列表</Button>
          </Space>
        )}
      />
    </PageContainer>
  )
}
