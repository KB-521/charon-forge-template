import type { FormInstance } from 'antd/es/form/Form'
import type { ColumnType } from 'antd/es/table'

import type {
  FilterValue,
  SorterResult,
  TablePaginationConfig,
} from 'antd/es/table/interface'
import type { DefaultOptionType } from 'antd/lib/select'
import type { DataNode } from 'antd/lib/tree'
import type { CSSProperties, ReactNode } from 'react'
import type { OptionRenderParams } from './useDefaultRender'
import { SearchOutlined } from '@ant-design/icons'
import { useRequest } from 'ahooks'
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  TreeSelect,
} from 'antd'
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useRowSelection } from '@/hooks/useRow'
import { ANT_SORT_TYPE_MAP } from '@/lib/constants'
import { FILTER_TYPE, PARAM_TYPE } from './constant'
import { columnWidthCheck } from './helper'
import styles from './index.module.css'

const { RangePicker } = DatePicker

export interface FilterType {
  fieldName: string
  /**
   * 列表字段名，用于设置级联选择器的每个层级字段
   */
  fieldNameList?: string[]
  type: FILTER_TYPE
  paramType?: PARAM_TYPE
  placeholder?: string
  placeholderList?: [string, string]
  available?: DefaultOptionType[] | DataNode[]
  width?: number
  /**
   * 一般用于设置筛选依赖
   * @param params // 筛选器参数
   * @returns
   */
  disabled?: (params: any) => boolean
  /**
   * 特殊配置项,直接作用于antd组件
   */
  uniOptions?: any
  /**
   * 普通值的装饰器，在发送请求前调用
   * @param value
   * @returns
   */
  decorator?: (value: any) => any
  /**
   * 对type为range_date的装饰器,分别为日期始参数和日期末参数的修饰方法,默认在fieldName后+Start\End
   */
  rangeDecorator?: {
    first: (fieldName: string) => string
    second: (fieldName: string) => string
  }
  className?: string
  onChange?: (value: any, formRef: FormInstance) => any
}

interface MetaSheetProps<T> {
  showNo?: boolean // 是否显示序号
  numeroFixed?: boolean // 当有其他列fix时默认fix
  fixHeader?: boolean // 默认关闭
  fixHeaderTop?: number // 固定头对上边缘的top，默认为导航栏的高度=55px
  fixFooter?: boolean
  columns: ColumnType<T>[]
  requestInterface: (data: any) => Promise<Http.PageRes<T>>
  filters?: FilterType[]
  topActionRender?: (value: Omit<OptionRenderParams, 'options'>) => ReactNode
  actionRender?: (value: Omit<OptionRenderParams, 'options'>) => ReactNode
  defaultRequestParams?: Record<keyof any, string>
  /**
   * 行前选择框类型，默认复选
   */
  rowSelectorType?: 'checkbox' | 'radio' | 'none'
  pageSizeOptions?: number[]
}
// 暴露的属性
export interface ReferableInterface {
  refresh: () => any
  rawData: any
  // setFieldsValue: FormInstance<any>['setFieldsValue']
  // getFieldsValue: FormInstance<any>['getFieldsValue']
}

export interface MetaSheetRef {
  refresh: () => any
  rawData: any
  // setFieldsValue: FormInstance<any>['setFieldsValue']
  // getFieldsValue: FormInstance<any>['getFieldsValue']
}

/**
 * 通用表格模板
 * filters为筛选器配置项,支持Input,Select,DatePick,RangeDatePick
 * 日期范围只需要传入fieldName的前缀，会自动生成Start、End参数
 * buttonOption默认是和selectRow禁用的，需要传入disabled或onlyRow来维持常态启用
 * defaultRequestParams作为默认参数，在每次请求中携带，优先级在filter之下
 * 筛选器使用Form包裹，暴露了setFieldValues来受控化
 * 新增了默认的固定首尾模式，可通过fixHeader、fixFooter关闭(fixHeader在过矮时不启用)
 *
 * @param props
 * @returns
 */

const DEFAULT_PAGE_SIZES = [20, 50, 100, 200]

function MetaSheet<T>(props: MetaSheetProps<T>, ref: React.Ref<MetaSheetRef>) {
  const {
    showNo = true,
    numeroFixed,
    columns,
    requestInterface,
    filters,
    topActionRender,
    actionRender,
    defaultRequestParams,
    rowSelectorType = 'checkbox',
    fixHeader = true,
    fixHeaderTop = 0,
    fixFooter = true,
    pageSizeOptions = DEFAULT_PAGE_SIZES,
  } = props
  // 分页数据控制
  const [currentPageData, setCurrentPageData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [currentPageSize, setCurrentPageSize] = useState<number>(
    pageSizeOptions[0] ?? 20,
  )
  const [total, setTotal] = useState<number>(0)
  // 表单参数
  const [formRef] = Form.useForm()
  // 参数代理
  const [paramProxy, setParamProxy] = useState<any>()
  // 排序代理
  const [sortProxy, setSortProxy] = useState<
    Partial<Record<'sortField' | 'sortOrder', string>>
  >({})

  // 表格过矮时不启用fix
  const proxyFixHeader = useMemo(() => {
    if (!currentPageData || currentPageData.length < 5) {
      return false
    }
    else {
      return fixHeader
    }
  }, [currentPageData, fixHeader])

  // 选择
  const {
    rowSelection,
    hasSelected,
    selectedRowKeys,
    renderSelectAlert,
    selectedRows,
    clearRowSelection,
  } = useRowSelection()

  // 请求封装
  const {
    run: runRequest,
    refresh: _refresh,
    loading,
  } = useRequest(requestInterface, {
    manual: true,
    // debounceInterval: 300,
    onSuccess(data: any) {
      setCurrentPageData(data.data.list)
      setTotal(data.data.total)
      // 清除选中
      clearRowSelection()
      // 筛选时超出当前页时
      if (data.data.total < currentPage * currentPageSize) {
        setCurrentPage(Math.ceil(data.data.total / currentPageSize) || 1)
      }
    },
  })

  // 刷新sheet
  const refreshSheet = useCallback(() => {
    _refresh()
    clearRowSelection()
  }, [_refresh, clearRowSelection])

  // 暴露方法
  useImperativeHandle(ref, (): ReferableInterface => {
    return {
      refresh: refreshSheet,
      rawData: currentPageData,
      // setFieldsValue: formRef.setFieldsValue,
      // getFieldsValue: () => {
      //   return { ...formRef.getFieldsValue(), pageSize: currentPageSize, pageIndex: currentPage }
      // },
    }
  })

  // 请求响应
  useEffect(() => {
    runRequest({
      ...(defaultRequestParams || {}),
      pageIndex: currentPage,
      pageSize: currentPageSize,
      ...paramProxy,
      ...sortProxy,
    })
  }, [
    currentPage,
    currentPageSize,
    defaultRequestParams,
    paramProxy,
    runRequest,
    sortProxy,
  ])

  // 提交请求
  const handleQuery = useCallback(() => {
    if (!filters)
      return

    // 格式化参数
    const formatParam: any = {}
    filters?.forEach((filter) => {
      if (filter.paramType === PARAM_TYPE.LIST) {
        try {
          if (!formRef.getFieldValue(filter.fieldName))
            return
          if (!Array.isArray(formRef.getFieldValue(filter.fieldName))) {
            formatParam[filter.fieldName] = [
              formRef.getFieldValue(filter.fieldName),
            ]
            return
          }
        }
        catch (error) {
          console.error(error)
          return
        }
      }
      if (filter.paramType === PARAM_TYPE.DATE) {
        try {
          formatParam[filter.fieldName] = formRef
            .getFieldValue(filter.fieldName)
            ?.format('YYYY-MM-DD')
          return
        }
        catch (error) {
          console.error(error)
          return
        }
      }
      if (
        filter.paramType === PARAM_TYPE.RANGE_DATE
        || filter.type === FILTER_TYPE.RANGE_DATE
      ) {
        try {
          if (
            formRef.getFieldValue(filter.fieldName)
            && formRef.getFieldValue(filter.fieldName)[0]
          ) {
            formatParam[
              filter?.rangeDecorator?.first
                ? filter.rangeDecorator.first(filter.fieldName)
                : `${filter.fieldName}Start`
            ] = formRef
              .getFieldValue(filter.fieldName)[0]
              ?.format('YYYY-MM-DD HH:mm:ss')
          }
          if (
            formRef.getFieldValue(filter.fieldName)
            && formRef.getFieldValue(filter.fieldName)[1]
          ) {
            formatParam[
              filter?.rangeDecorator?.second
                ? filter?.rangeDecorator?.second(filter.fieldName)
                : `${filter.fieldName}End`
            ] = formRef
              .getFieldValue(filter.fieldName)[1]
              ?.format('YYYY-MM-DD HH:mm:ss')
          }
          return
        }
        catch (error) {
          console.error(error)
          return
        }
      }
      if (filter.paramType === PARAM_TYPE.NUMBER) {
        const raw = formRef.getFieldValue(filter.fieldName)
        if (raw === undefined || raw === null || raw === '')
          return
        const value = Number(raw)
        formatParam[filter.fieldName] = filter.decorator
          ? filter.decorator(value)
          : value
        return
      }
      // default
      const value = formRef.getFieldValue(filter.fieldName)
      formatParam[filter.fieldName] = filter.decorator
        ? filter.decorator(value)
        : value
    })

    setCurrentPage(1)
    setParamProxy({ ...formatParam })
  }, [filters, formRef])
  // 重置请求
  const handleReset = useCallback(() => {
    formRef.resetFields()
    setCurrentPage(1)
    setParamProxy(null)
  }, [formRef])

  // 过滤器渲染
  const filterRender = useMemo(() => {
    if (!filters || filters.length === 0)
      return null
    return filters.map((filter) => {
      if (filter.type === FILTER_TYPE.INPUT) {
        return (
          <Form.Item
            key={filter.fieldName}
            className={styles['form-item']}
            name={filter.fieldName}
          >
            <Input
              className={filter?.className}
              suffix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{ width: filter?.width }}
              placeholder={filter?.placeholder}
              onChange={(e) => {
                if (filter?.onChange)
                  filter.onChange(e, formRef)
              }}
              onPressEnter={handleQuery}
              disabled={
                filter?.disabled
                  ? filter.disabled(formRef.getFieldsValue())
                  : false
              }
              {...filter?.uniOptions}
            />
          </Form.Item>
        )
      }
      if (filter.type === FILTER_TYPE.SELECT) {
        return (
          <Form.Item
            key={filter.fieldName}
            className={styles['form-item']}
            name={filter.fieldName}
          >
            <Select
              className={filter?.className}
              style={{ width: filter?.width }}
              mode={
                filter?.paramType === PARAM_TYPE.LIST ? 'multiple' : undefined
              }
              allowClear
              options={filter?.available}
              placeholder={filter?.placeholder}
              showArrow
              onChange={(e) => {
                if (filter?.onChange)
                  filter.onChange(e, formRef)
              }}
              disabled={
                filter?.disabled
                  ? filter.disabled(formRef.getFieldsValue())
                  : false
              }
              {...filter?.uniOptions}
            />
          </Form.Item>
        )
      }
      if (filter.type === FILTER_TYPE.TREE_SELECT) {
        return (
          <Form.Item
            key={filter.fieldName}
            className={styles['form-item']}
            name={filter.fieldName}
          >
            <TreeSelect
              className={filter?.className}
              style={{ width: filter?.width }}
              allowClear
              treeData={filter?.available}
              placeholder={filter?.placeholder}
              showArrow
              onChange={(e) => {
                if (filter?.onChange)
                  filter.onChange(e, formRef)
              }}
              disabled={
                filter?.disabled
                  ? filter.disabled(formRef.getFieldsValue())
                  : false
              }
              {...filter?.uniOptions}
            />
          </Form.Item>
        )
      }
      if (filter.type === FILTER_TYPE.DATE) {
        return (
          <Form.Item
            key={filter.fieldName}
            className={styles['form-item']}
            name={filter.fieldName}
          >
            <DatePicker
              className={filter?.className}
              style={{ width: filter?.width }}
              showTime
              placeholder={filter?.placeholder}
              onChange={(e) => {
                if (filter?.onChange)
                  filter.onChange(e, formRef)
              }}
              disabled={
                filter?.disabled
                  ? filter.disabled(formRef.getFieldsValue())
                  : false
              }
              {...filter?.uniOptions}
            />
          </Form.Item>
        )
      }
      if (filter.type === FILTER_TYPE.RANGE_DATE) {
        return (
          <Form.Item
            key={filter.fieldName}
            className={styles['form-item']}
            name={filter.fieldName}
          >
            <RangePicker
              className={filter?.className}
              style={{ width: filter?.width }}
              showTime
              placeholder={filter?.placeholderList}
              onChange={(e) => {
                if (filter?.onChange)
                  filter.onChange(e, formRef)
              }}
              disabled={
                filter?.disabled
                  ? filter.disabled(formRef.getFieldsValue())
                  : false
              }
              {...filter?.uniOptions}
            />
          </Form.Item>
        )
      }
      return null
    })
  }, [filters, formRef, handleQuery])

  const paginationProps = useMemo(() => {
    return {
      pageSizeOptions,
      current: currentPage, // 当前页码
      pageSize: currentPageSize,
      total,
      showQuickJumper: true,
      showSizeChanger: false,
      onChange: (page: number) => setCurrentPage(page),
      onShowSizeChange: (_currentPage: number, size: number) =>
        setCurrentPageSize(size),
      showTotal: (_total: number) => `共查询到 ${_total} 条记录`,
    }
  }, [currentPage, currentPageSize, pageSizeOptions, total])

  /**
   * 获取dom结点计算实际元素高度
   */
  const topWrapRef = useRef<any>()
  const bottomWrapRef = useRef<any>()

  const getOffset = useCallback(() => {
    try {
      if (topWrapRef.current) {
        const top = window.getComputedStyle(topWrapRef.current).height
        if (hasSelected) {
          return Number(String(top).slice(0, -2)) + 40
        }
        return Number(String(top).slice(0, -2))
      }
    }
    catch (error) {
      console.error(error)
    }
    return 0
  }, [hasSelected])

  const topWrapStyle = (): CSSProperties | undefined => {
    if (!proxyFixHeader)
      return undefined
    return {
      position: 'sticky',
      top: `${fixHeaderTop}px`,
      zIndex: 10,
    }
  }

  const bottomWrapStyle = (): CSSProperties | undefined => {
    if (!fixFooter)
      return undefined
    return {
      position: 'sticky',
      bottom: '0px',
      zIndex: 10,
      padding: '10px 0px',
    }
  }

  const getStickyOptions = useCallback(() => {
    if (proxyFixHeader && fixFooter) {
      return { offsetHeader: getOffset() + fixHeaderTop, offsetScroll: 48 }
    }
    if (proxyFixHeader) {
      return { offsetHeader: getOffset() + fixHeaderTop }
    }
    if (fixFooter) {
      return { offsetScroll: 48 }
    }
    return false
  }, [fixFooter, fixHeaderTop, getOffset, proxyFixHeader])

  // 处理Table参数变更，目前只处理了sorter
  const handleTableChange = useCallback(
    (
      _: TablePaginationConfig,
      __: Record<string, FilterValue | null>,
      sorter: SorterResult<T> | SorterResult<T>[],
    ) => {
      const active = (Array.isArray(sorter) ? sorter : [sorter]).filter(
        item => item.order && item.field,
      )
      setCurrentPage(1)
      setSortProxy({
        sortField:
          active.map(item => String(item.field)).join(',') || undefined,
        sortOrder:
          active.map(item => ANT_SORT_TYPE_MAP[item.order!]).join(',')
          || undefined,
      })
    },
    [],
  )

  const minColWidth = useMemo(() => {
    return columns.reduce((acc: number, col) => {
      if (col.width) {
        return acc + Number(col.width)
      }
      if (typeof col.title === 'string') {
        return acc + String(col.title).length * 30
      }
      return acc + 150
    }, 0)
  }, [columns])

  const getColumns = useMemo(() => {
    let cols = columns
    if (showNo) {
      const numero = {
        title: '序号',
        dataIndex: 'any',
        key: 'index-MetaSheet',
        render: (_: any, record: any, index: number) => {
          return index + 1 + (currentPage - 1) * currentPageSize
        },
      }
      if (numeroFixed) {
        Object.defineProperty(numero, 'fixed', {
          value: 'left',
          enumerable: true,
        })
      }
      if (columns[0]?.fixed === 'left') {
        Object.defineProperty(numero, 'fixed', {
          value: 'left',
          enumerable: true,
        })
      }
      cols = [numero, ...cols]
    }

    return columnWidthCheck(cols)
  }, [columns, currentPage, currentPageSize, numeroFixed, showNo])

  return (
    <div className={styles.wrap}>
      <div className={styles['top-wrap']} style={topWrapStyle()}>
        <div className={styles['top-content']} ref={topWrapRef}>
          {topActionRender
          && topActionRender({
            selectedRowKeys,
            selectedRows,
            refreshSheet,
            hasSelected,
          })}
          <div className={styles['filters-wrap']}>
            <Form component={false} form={formRef}>
              {filterRender}
            </Form>
            {filters && filters.length > 0 && (
              <Space className={styles['filters-options']}>
                <Button
                  className={styles.button}
                  type="primary"
                  onClick={handleQuery}
                >
                  查询
                </Button>
                <Button className={styles.button} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            )}
          </div>
          {actionRender
          && actionRender({
            selectedRowKeys,
            selectedRows,
            refreshSheet,
            hasSelected,
          })}
        </div>
        <div className={styles['select-alert-wrap']}>{renderSelectAlert}</div>
      </div>
      <div className={styles['table-wrap']}>
        <Table
          onChange={handleTableChange}
          sticky={getStickyOptions()}
          loading={loading}
          rowSelection={
            rowSelectorType !== 'none'
              ? { ...rowSelection, type: rowSelectorType }
              : undefined
          }
          scroll={{ x: minColWidth }}
          className={styles['footer-table']}
          dataSource={(currentPageData || []).map((item, index) => {
            return {
              ...item,
              key: item?.id ?? index,
            }
          })}
          columns={getColumns}
          pagination={false}
        />
      </div>
      <div
        className={styles['pagination-wrap']}
        ref={bottomWrapRef}
        style={bottomWrapStyle()}
      >
        <Row gutter={16}>
          <Col style={{ flex: 1 }}>
            <Pagination {...paginationProps} />
          </Col>
          <Col>
            <Select
              options={pageSizeOptions.map((option) => {
                return {
                  label: `${option}条/页`,
                  value: option,
                }
              })}
              value={currentPageSize}
              onSelect={(value) => {
                setCurrentPage(1)
                setCurrentPageSize(value)
              }}
              placement="topRight"
              className={styles['page-sizer']}
            />
          </Col>
        </Row>
      </div>
    </div>
  )
}
export default React.forwardRef(MetaSheet) as <T>(
  props: MetaSheetProps<T> & { ref?: React.ForwardedRef<MetaSheetRef> },
) => ReturnType<typeof MetaSheet>
