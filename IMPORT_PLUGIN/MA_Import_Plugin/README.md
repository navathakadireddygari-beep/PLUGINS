api curl for tables values : curl --request GET \
 --url 'https://gisdev.uk.experian.eeco/ords/xxexp_gis_v1/GIS/proposalAuthoring/financialEvaluation?spc_type_id=105&template_type_id=301' \
 --header 'authorization: Bearer \_gT9SOFQN7yBweEn8c1L4A' \
 --header 'role: APP_FIN_GIS_SPC_AUTHOR_SPC_ALL,APP_FIN_GIS_RLS_NA_AUTOMOTIVE_SPC_ALL' \
 --header 'user_email: arvind.tammineni@test.exp.com'

response:

{
"apiStatus": "S",
"apiMessage": "Financial evaluation template retrieved successfully",
"data": {
"items": {
"fin_eval_header_id": null,
"proposal_id": null,
"proposal_title": null,
"proposal_code": null,
"local_currency": null,
"display_currency": null,
"exchange_rate": null,
"hurdle_rate_percent": null,
"discount_rate_percent": null,
"share_repurchase_percent": null,
"amortisation_period_years": null,
"date_placed_in_service": null,
"tax_rate_percent": null,
"display_years": 7,
"kpi_type": null,
"number_of_years": null,
"avg_weekly_peak_headcount": null,
"npv": null,
"irr_percent": null,
"payback_period_years": null,
"total_cash_inflow": null,
"total_cash_outflow": null,
"gross_profit": null,
"gross_margin_percent": null,
"contribution_margin_percent": null,
"total_contract_value": null,
"annual_contract_value": null,
"contract_duration": null,
"total_lease_value": null,
"lease_terms_years": null,
"investment": null,
"annual_cost": null,
"investment_term_years": null,
"total_capex_investment": null,
"annual_opex": null,
"performance_metrics": null,
"m_a_key_inputs": {
"inputs": [
{
"input_code": "WACC",
"label": "WACC",
"unit": "PERCENT",
"value": null,
"is_calculated": "N",
"source_column": null,
"display_order": 10
},
{
"input_code": "TERMINAL_GROWTH_RATE",
"label": "Terminal growth rate",
"unit": "PERCENT",
"value": null,
"is_calculated": "N",
"source_column": null,
"display_order": 20
},
{
"input_code": "DISCOUNT_RATE",
"label": "Discount rate",
"unit": "PERCENT",
"value": null,
"is_calculated": "N",
"source_column": "DISCOUNT_RATE_PERCENT",
"display_order": 30
},
{
"input_code": "TAX_RATE",
"label": "Tax rate",
"unit": "PERCENT",
"value": null,
"is_calculated": "N",
"source_column": "TAX_RATE_PERCENT",
"display_order": 40
}
],
"captured_at": null
},
"m_a_npv_calculation": {
"discount_rate_percent": null,
"components": [
{
"component_code": "PV_YEARS_0_7",
"label": "PV of Yrs 0-7",
"target_standalone": null,
"experian_factor": null,
"total": null,
"is_calculated": "Y",
"is_mandatory": "N",
"display_order": 10
},
{
"component_code": "PV_TERMINAL_VALUE",
"label": "PV of Terminal Value",
"target_standalone": null,
"experian_factor": null,
"total": null,
"is_calculated": "Y",
"is_mandatory": "N",
"display_order": 20
},
{
"component_code": "TOTAL_PRESENT_VALUE",
"label": "Total Present Value",
"target_standalone": null,
"experian_factor": null,
"total": null,
"is_calculated": "Y",
"is_mandatory": "N",
"display_order": 30
},
{
"component_code": "PV_OF_INVESTMENT",
"label": "PV of Investment",
"target_standalone": null,
"experian_factor": null,
"total": null,
"is_calculated": "Y",
"is_mandatory": "Y",
"display_order": 40
},
{
"component_code": "NPV_AT_DISCOUNT_RATE",
"label": "NPV @ Discount Rate",
"target_standalone": null,
"experian_factor": null,
"total": null,
"is_calculated": "Y",
"is_mandatory": "Y",
"display_order": 50
},
{
"component_code": "ENTERPRISE_VALUE",
"label": "Enterprise Value",
"target_standalone": null,
"experian_factor": null,
"total": null,
"is_calculated": "Y",
"is_mandatory": "N",
"display_order": 60
},
{
"component_code": "TAX_BENEFIT",
"label": "Tax Benefit",
"target_standalone": null,
"experian_factor": null,
"total": null,
"is_calculated": "N",
"is_mandatory": "N",
"display_order": 70
},
{
"component_code": "NET_PURCHASE_PRICE",
"label": "Net Purchase Price",
"target_standalone": null,
"experian_factor": null,
"total": null,
"is_calculated": "Y",
"is_mandatory": "N",
"display_order": 80
}
],
"computed_at": null
},
"m_a_valuation_summary": {
"metrics": [],
"computed_at": null
},
"npv_actuals": null,
"irr_actuals_percent": null,
"payback_actuals_years": null,
"npv_variance": null,
"irr_variance": null,
"payback_variance": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"scopes": [],
"status": null,
"language_code": null,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null,
"sections": [
{
"fin_eval_section_id": null,
"parent_fin_eval_section_id": null,
"parent_template_section_id": null,
"section_name": "Revenue",
"section_type": "REVENUE",
"is_custom": "N",
"is_read_only": "N",
"is_account_required": "N",
"is_new_line_required": "Y",
"is_mandatory": "Y",
"is_go_live_req": "N",
"display_order": 10,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"section_description": "Target standalone revenues plus Experian factor revenues.",
"template_section_id": 8858,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null,
"lines": [
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Standalone Revenues",
"line_identifier": "Financial",
"is_calculated": "N",
"is_custom": "N",
"is_read_only": "N",
"is_mandatory": "Y",
"account": null,
"display_order": 10,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "STANDALONE_REVENUES",
"template_fin_eval_line_id": 802,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Experian Factor Revenues",
"line_identifier": "Financial",
"is_calculated": "N",
"is_custom": "N",
"is_read_only": "N",
"is_mandatory": "Y",
"account": null,
"display_order": 20,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "EXPERIAN_FACTOR_REVENUES",
"template_fin_eval_line_id": 803,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Revenue",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 30,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "REVENUE_TOTAL",
"template_fin_eval_line_id": 804,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
}
]
},
{
"fin_eval_section_id": null,
"parent_fin_eval_section_id": null,
"parent_template_section_id": null,
"section_name": "Total Costs",
"section_type": "COSTS",
"is_custom": "N",
"is_read_only": "N",
"is_account_required": "N",
"is_new_line_required": "Y",
"is_mandatory": "Y",
"is_go_live_req": "N",
"display_order": 20,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"section_description": "Standalone costs, Experian factor costs, cost synergies and D and A.",
"template_section_id": 9256,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null,
"lines": [
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Standalone Costs",
"line_identifier": "Financial",
"is_calculated": "N",
"is_custom": "N",
"is_read_only": "N",
"is_mandatory": "Y",
"account": null,
"display_order": 10,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "STANDALONE_COSTS",
"template_fin_eval_line_id": 805,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Experian Factor Costs",
"line_identifier": "Financial",
"is_calculated": "N",
"is_custom": "N",
"is_read_only": "N",
"is_mandatory": "Y",
"account": null,
"display_order": 20,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "EXPERIAN_FACTOR_COSTS",
"template_fin_eval_line_id": 806,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Cost Synergies",
"line_identifier": "Financial",
"is_calculated": "N",
"is_custom": "N",
"is_read_only": "N",
"is_mandatory": "Y",
"account": null,
"display_order": 30,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "COST_SYNERGIES",
"template_fin_eval_line_id": 807,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Depreciation and Amortization",
"line_identifier": "Financial",
"is_calculated": "N",
"is_custom": "N",
"is_read_only": "N",
"is_mandatory": "Y",
"account": null,
"display_order": 40,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "DEPRECIATION_AMORTIZATION",
"template_fin_eval_line_id": 808,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Total Costs",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 50,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "COSTS_TOTAL",
"template_fin_eval_line_id": 809,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
}
]
},
{
"fin_eval_section_id": null,
"parent_fin_eval_section_id": null,
"parent_template_section_id": null,
"section_name": "Returns Analysis",
"section_type": "RETURNS_ANALYSIS",
"is_custom": "N",
"is_read_only": "Y",
"is_account_required": "N",
"is_new_line_required": "N",
"is_mandatory": "Y",
"is_go_live_req": "N",
"display_order": 30,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"section_description": "EBIT, EBITDA and their margin/growth rows, plus the standalone results memo.",
"template_section_id": 9654,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null,
"lines": [
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "EBIT",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 10,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "EBIT",
"template_fin_eval_line_id": 810,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "% Margin",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 20,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "EBIT_MARGIN_PCT",
"template_fin_eval_line_id": 811,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "% Growth",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 30,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "EBIT_GROWTH_PCT",
"template_fin_eval_line_id": 812,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "EBITDA",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 40,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "EBITDA",
"template_fin_eval_line_id": 813,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "% Margin",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 50,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "EBITDA_MARGIN_PCT",
"template_fin_eval_line_id": 814,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "% Growth",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 60,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "EBITDA_GROWTH_PCT",
"template_fin_eval_line_id": 815,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Standalone EBIT",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 70,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "STANDALONE_EBIT",
"template_fin_eval_line_id": 816,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Standalone taxes payable",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 80,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "STANDALONE_TAXES_PAYABLE",
"template_fin_eval_line_id": 817,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Standalone operating cashflow",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 90,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "STANDALONE_OPERATING_CASHFLOW",
"template_fin_eval_line_id": 818,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "7-Year Terminal Value",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 100,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "STANDALONE_TERMINAL_VALUE_7YR",
"template_fin_eval_line_id": 819,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Standalone EBIT margin %",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 110,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "STANDALONE_EBIT_MARGIN_PCT",
"template_fin_eval_line_id": 820,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
}
]
},
{
"fin_eval_section_id": null,
"parent_fin_eval_section_id": null,
"parent_template_section_id": null,
"section_name": "Combined Free Cash Flows",
"section_type": "COMBINED_FREE_CASH_FLOWS",
"is_custom": "N",
"is_read_only": "N",
"is_account_required": "N",
"is_new_line_required": "N",
"is_mandatory": "Y",
"is_go_live_req": "N",
"display_order": 40,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"section_description": "EBIT-to-net-free-cash-flow bridge including integration costs, capex, WC and terminal value.",
"template_section_id": 10052,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null,
"lines": [
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "EBIT",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 10,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "CF_EBIT",
"template_fin_eval_line_id": 821,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "One-time exceptional integration costs",
"line_identifier": "Financial",
"is_calculated": "N",
"is_custom": "N",
"is_read_only": "N",
"is_mandatory": "Y",
"account": null,
"display_order": 20,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "INTEGRATION_COSTS_ONE_TIME",
"template_fin_eval_line_id": 822,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Depreciation and Amortization",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 30,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "AMORT_DEPREC",
"template_fin_eval_line_id": 823,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Taxes payable",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 40,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "CASH_TAX_EBIT",
"template_fin_eval_line_id": 824,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Operating Free Cash Flow",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 70,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "OPERATING_CF",
"template_fin_eval_line_id": 827,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Experian Share of Operating Free Cash Flow",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 90,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "EXPERIAN_SHARE_OPERATING_FCF",
"template_fin_eval_line_id": 829,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Purchase Price",
"line_identifier": "Financial",
"is_calculated": "N",
"is_custom": "N",
"is_read_only": "N",
"is_mandatory": "Y",
"account": null,
"display_order": 100,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "PURCHASE_PRICE",
"template_fin_eval_line_id": 830,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Terminal value",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 110,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "TERMINAL_VALUE",
"template_fin_eval_line_id": 831,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Net Free Cash Flow",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 120,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "NET_CASH_FLOW",
"template_fin_eval_line_id": 832,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
}
]
},
{
"fin_eval_section_id": null,
"parent_fin_eval_section_id": null,
"parent_template_section_id": null,
"section_name": "Post Tax Return",
"section_type": "POST_TAX_RETURN",
"is_custom": "N",
"is_read_only": "Y",
"is_account_required": "N",
"is_new_line_required": "N",
"is_mandatory": "Y",
"is_go_live_req": "N",
"display_order": 50,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"section_description": "Post-tax EBIT and return on invested capital.",
"template_section_id": 10450,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null,
"lines": [
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "EBIT",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 10,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "PTR_EBIT",
"template_fin_eval_line_id": 833,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Taxes payable",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 20,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "PTR_TAXES_PAYABLE",
"template_fin_eval_line_id": 834,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "EBIT after Tax",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 30,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "EBIT_AFTER_TAX",
"template_fin_eval_line_id": 835,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Cash benefits",
"line_identifier": "Financial",
"is_calculated": "N",
"is_custom": "N",
"is_read_only": "N",
"is_mandatory": "Y",
"account": null,
"display_order": 40,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "CASH_BENEFITS",
"template_fin_eval_line_id": 836,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Post tax EBIT",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 50,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "POST_TAX_EBIT",
"template_fin_eval_line_id": 837,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
},
{
"fin_eval_line_id": null,
"fin_eval_section_id": null,
"line_type": null,
"line_item_name": "Post tax return",
"line_identifier": "Financial",
"is_calculated": "Y",
"is_custom": "N",
"is_read_only": "Y",
"is_mandatory": "Y",
"account": null,
"display_order": 60,
"year_values": {
"fy24": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy25": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy26": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy27": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy28": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy29": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy30": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy31": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy32": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"fy33": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
},
"total": {
"spc_projected_amount": null,
"ytd_budgeted_forecast": null,
"ytd_actuals": null,
"variance": null
}
},
"target_go_live_date": null,
"region_code": null,
"country_code": null,
"entity_code": null,
"bu_code": null,
"status": "ACTIVE",
"language_code": "EN",
"line_item_code": "POST_TAX_RETURN",
"template_fin_eval_line_id": 838,
"created_by": null,
"creation_date": null,
"last_updated_by": null,
"last_updated_date": null
}
]
}
]
}
}
}

also for token this is the api : curl --request POST \
 --url https://gisdev.uk.experian.eeco/ords/xxexp_gis_v1/oauth/token \
 --header 'authorization: Basic QVRCNEI5OEVWZ1RnZm1rUUJ2ek5ndy4uOk9TWDJBVUJoWVZyMThDVG5HOVZQZEEuLg==' \
 --header 'content-type: application/x-www-form-urlencoded' \
 --data grant_type=client_credentials

response : {
"access_token": "z1TEsAZmKBtiwDciVy3Sqg",
"token_type": "bearer",
"expires_in": 3600
} , use this for token, create a function for this since it can be used at other places, for the get api also use this, also for every api calls, use axios
