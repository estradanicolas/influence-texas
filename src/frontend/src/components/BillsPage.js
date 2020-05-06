import React, { useState } from "react";
import DonutChart from "./DonutChart";
import BillList from "./BillList";
import FilterSection from "./FilterSection";
import { gql } from "apollo-boost";
import { getQueryString, dashesToSpaces } from "../utils";
import { useHistory } from "react-router-dom";
import { Typography } from "@material-ui/core";

const ALL_BILLS = gql`
  query AllBills(
    $chamber: String
    $classification: String
    $party: String
    $multipleSponsors: Boolean
    $first: Int
    $last: Int
    $after: String
    $before: String
  ) {
    bills(
      chamber_Icontains: $chamber
      classification: $classification
      multipleSponsors: $multipleSponsors
      party: $party
      first: $first
      last: $last
      after: $after
      before: $before
    ) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      edges {
        cursor
        node {
          pk
          chamber
          billId
          title
        }
      }
    }
    billClassificationStats(
      chamber: $chamber
      multipleSponsors: $multipleSponsors
      party: $party
    ) {
      name
      count
    }
  }
`;

function BillsPage() {
  const history = useHistory();
  const queryObj = getQueryString(history);
  const [listData, setListData] = useState();

  const billClassificationStats = listData
    ? listData.billClassificationStats
    : [];
  const classificationTags = billClassificationStats.map(d => ({
    name: dashesToSpaces(d.name),
    value: d.name,
    group: "classification"
  }));
  const summaryData = billClassificationStats.map(d => ({
    name: dashesToSpaces(d.name),
    value: d.count
  }));

  return (
    <div>
      <FilterSection
        title={
          <Typography variant="h6" style={{ minWidth: "150px" }}>
            Texas Bills
          </Typography>
        }
        tags={{
          chamber: [
            { name: "House", value: "HOUSE" },
            { name: "Senate", value: "SENATE" }
          ],
          party: [
            { name: "Republican", value: "R" },
            { name: "Bipartisan", value: "Bipartisan" },
            { name: "Democratic", value: "D" }
          ],
          multipleSponsors: [{ name: "Multiple Sponsors", value: true }],
          classification: classificationTags
        }}
      />
      <div className="two-column">
        <DonutChart
          data={summaryData}
          totalCount={listData ? listData.bills.totalCount : 0}
          totalText="Bills"
          selectedSlice={dashesToSpaces(queryObj.classification)}
        />
        <BillList
          gqlQuery={ALL_BILLS}
          gqlVariables={queryObj}
          title="All Bills"
          onDataFetched={setListData}
        />
      </div>
    </div>
  );
}

export default BillsPage;