/**
 * A vtag (virtual tag) maps raw billing rows to a label.
 *
 * Structure:
 *   name    — the column name added to each row
 *   rules   — ordered list. First matching rule wins.
 *   default — fallback label when no rule matches
 *
 * Each rule has:
 *   conditions — array of conditions, ALL must match (AND logic)
 *   value      — label to assign when rule matches
 *
 * Each condition has:
 *   field     — billing row column name (service, account_id, region, ...)
 *   operator  — eq | in | not_in | contains
 *   value     — the operand: array for in/not_in, scalar for eq/contains
 */

export const TEAM_VTAG = {
  name: 'team',
  rules: [
    {
      conditions: [
        { field: 'service', operator: 'in', value: ['AmazonEC2', 'AmazonEKS'] },
        { field: 'region',  operator: 'eq', value: 'us-east-1' },
      ],
      value: 'Infrastructure-East',
    },
    {
      conditions: [
        { field: 'service', operator: 'in', value: ['AmazonEC2', 'AmazonEKS'] },
      ],
      value: 'Infrastructure',
    },
    {
      conditions: [
        { field: 'service', operator: 'in', value: ['AmazonRDS', 'AmazonDynamoDB'] },
      ],
      value: 'Data',
    },
    {
      conditions: [
        { field: 'service', operator: 'in', value: ['AWSLambda', 'AmazonAPIGateway'] },
      ],
      value: 'Backend',
    },
    {
      conditions: [
        { field: 'account_id', operator: 'in', value: ['111111111111', '222222222222'] },
      ],
      value: 'Platform',
    },
  ],
  default: 'Unallocated',
};
