import React, { useEffect } from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableRow from '@material-ui/core/TableRow'
import {
  IconButton,
  Typography,
  Collapse,
  Link as MaterialLink,
} from '@material-ui/core'
import ChevronLeft from '@material-ui/icons/ChevronLeft'
import ChevronRight from '@material-ui/icons/ChevronRight'
import styled from 'styled-components'
import { useHistory } from 'react-router-dom'
import { useQuery } from '@apollo/react-hooks'
import { RoundSquare, BlankLoadingLine } from 'styles'
import { getQueryString, setQueryString } from 'utils'
import ExpandLess from '@material-ui/icons/ExpandLess'
import ExpandMore from '@material-ui/icons/ExpandMore'
import { Link } from 'react-router-dom'

const StyleWrapper = styled.div`
  /* margin-left: -1em;
  width: calc(100% + 2em); */
`

function getProp(obj, propName) {
  if (!propName || !obj) {
    return
  }
  if (propName.includes('.')) {
    return propName.split('.').reduce((o, i) => o && o[i], obj)
  }
  return obj[propName]
}
const zeroPageInfo = {
  page: null,
  first: null,
  last: null,
  before: null,
  after: null,
}

export default function PaginatedList(props) {
  if (props.gqlQuery) {
    return <FetchingList {...props} />
  } else {
    const { edges, totalCount } = props.data || { edges: [], totalCount: 0 }
    return (
      <SimpleList
        {...props}
        totalCount={props.totalCount || totalCount}
        rows={edges}
      />
    )
  }
}

function FetchingList({
  columns,
  url,
  pk = 'node.pk',
  emptyState = 'None found',
  title = '',
  sortOrderText = '',
  hidePagination = false,
  rowsPerPage = 10,
  gqlQuery,
  gqlVariables = {},
  onDataFetched,
  /** where main list is. ex: 'search.legislators', needs to be a place with edges and pagination */
  nestedUnder,
  ...props
}) {
  const history = useHistory()
  const queryObj = getQueryString(history)

  function onSetPageVars(pageVars) {
    let queryObj = getQueryString(history)
    queryObj = { ...queryObj, ...pageVars }
    setQueryString(queryObj, history)
  }
  // url is source of truth
  // should allow set page from outside or in
  const { data, loading, error } = useQuery(gqlQuery, {
    variables: {
      first: rowsPerPage,
      ...queryObj,
      ...gqlVariables,
    },
  })

  useEffect(() => {
    if (!data) return
    if (onDataFetched) {
      onDataFetched(data)
    }
    /* eslint-disable react-hooks/exhaustive-deps*/
  }, [data])

  const baseList = nestedUnder
    ? getProp(data, nestedUnder)
    : Object.values(data || {})[0]
  // don't care about the data.legislators.edges, will only call one top level each

  const { edges, totalCount, pageInfo } = baseList || {
    edges: [],
    totalCount: 0,
  }
  const { startCursor, endCursor } = pageInfo || {}
  const rows = edges
  if (error) {
    return 'server error'
  }
  const page = queryObj.page || 1
  const totalPages = Math.ceil(totalCount / rowsPerPage)
  return (
    <StyleWrapper {...props}>
      <SimpleList
        {...{
          title,
          sortOrderText,
          totalCount,
          columns,
          rows,
          pk,
          url,
          loading,
        }}
      />
      {totalCount > rowsPerPage && !hidePagination && (
        <div
          className="pagination"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignContent: 'baseline',
          }}
        >
          <div class="scrollGradient" />
          <div style={{ padding: '1em' }}>{totalCount} Results </div>
          <div>
            Page {page} of {totalPages}
            <IconButton
              aria-label="Previous page"
              children={<ChevronLeft />}
              disabled={page === 1}
              onClick={() => {
                const pageInfo = {
                  ...zeroPageInfo,
                  before: startCursor,
                  last: rowsPerPage,
                  page: page - 1,
                }
                onSetPageVars(pageInfo)
              }}
              title="Previous page"
            />
            <IconButton
              aria-label="Next page"
              children={<ChevronRight />}
              disabled={page >= totalPages}
              onClick={() => {
                const pageInfo = {
                  ...zeroPageInfo,
                  after: endCursor,
                  first: rowsPerPage,
                  page: page + 1,
                }
                onSetPageVars(pageInfo)
              }}
              title="Next page"
            />
          </div>
        </div>
      )}
    </StyleWrapper>
  )
}

const ShortLoadingListItem = (
  <TableRow>
    <TableCell>
      <BlankLoadingLine />
    </TableCell>
  </TableRow>
)

export const ShortLoadingListBody = (
  <TableBody>
    {Array.apply(null, Array(9)).map((row, i) => ShortLoadingListItem)}
  </TableBody>
)

export const LoadingListItem = (
  <TableRow>
    <TableCell width={50}>
      <RoundSquare />
    </TableCell>
    <TableCell style={{ width: '100%' }}>
      <BlankLoadingLine width="50%" />
      <BlankLoadingLine width="80%" />
      <BlankLoadingLine />
    </TableCell>
  </TableRow>
)

const LoadingListBody = (
  <TableBody>
    {Array.apply(null, Array(10)).map((row, i) => LoadingListItem)}
  </TableBody>
)

export function SimpleList({
  totalCount,
  rows = [],
  columns,
  url,
  pk = 'node.pk',
  emptyState = 'None found',
  title = '',
  sortOrderText = '',
  hidePagination = false,
  rowsPerPage = 10,
  showHover,
  loading,
  loadingListBody = LoadingListBody,
  defaultOpen = true,
  ...props
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  if (props.hideIfNoResults && rows.length === 0) {
    return null
  }
  return (
    <StyleWrapper {...props}>
      <TableContainer className="list">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            margin: '0 1em',
          }}
          onClick={props.collapsable ? () => setOpen(!open) : () => null}
          className={props.collapsable && 'hover-pointer'}
        >
          <Typography variant="h6" style={{ width: '100%' }}>
            {title}
            <span
              variant="subtitle2"
              style={{ fontSize: '.75em', opacity: 0.5, margin: '1em' }}
            >
              {loading ? 'loading' : `${totalCount} Results`}
            </span>
            {props.collapsable && (open ? <ExpandLess /> : <ExpandMore />)}
          </Typography>

          <Typography variant="h6">{sortOrderText}</Typography>
        </div>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Table aria-label="simple table">
            {loading ? (
              loadingListBody
            ) : (
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow
                    key={getProp(row, pk) || i}
                    hover={showHover ? showHover(row) : !!url}
                    component={url && pk && Link}
                    style={{ width: '100%' }}
                    to={`/${url}/${getProp(row, pk)}`}
                  >
                    {columns.map((c, i) => {
                      if (c.render) {
                        return <TableCell key={i}>{c.render(row)}</TableCell>
                      } else {
                        return (
                          <TableCell key={i}>{getProp(row, c.field)}</TableCell>
                        )
                      }
                    })}
                    {rows.length === 0 && emptyState}
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </Collapse>
      </TableContainer>
    </StyleWrapper>
  )
}

export function ShowMoreList({
  totalCount,
  rows = [],
  title,
  render,
  rowsToShow = 6,
  loadingListBody = LoadingListBody,
  loading = false,
  hideIfNoResults = false,
}) {
  const [open, setOpen] = React.useState(false)
  if (hideIfNoResults && rows.length === 0) {
    return null
  }
  return (
    <StyleWrapper>
      <TableContainer
        style={{
          overflowX: 'initial',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            margin: '0 1em',
          }}
        >
          <Typography variant="h6" style={{ width: '100%' }}>
            {title}
            <span
              variant="subtitle2"
              style={{ fontSize: '.75em', opacity: 0.5, margin: '1em' }}
            >
              {loading ? 'loading' : `${totalCount} Results`}
            </span>
          </Typography>
        </div>
        <Table aria-label="simple table">
          {loading ? (
            loadingListBody
          ) : (
            <TableBody>
              {rows.slice(0, rowsToShow).map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{render(row)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Table aria-label="simple table">
            <TableBody>
              {rows.slice(rowsToShow).map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{render(row)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Collapse>
        {!open && rows.length > rowsToShow && (
          <MaterialLink
            style={{
              justifyContent: 'center',
              padding: '1em',
              cursor: 'pointer',
            }}
            onClick={() => setOpen(!open)}
            color="primary"
          >
            Show {rows.length - rowsToShow} More <ExpandMore />
          </MaterialLink>
        )}
      </TableContainer>
    </StyleWrapper>
  )
}
