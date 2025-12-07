package database

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// SupabaseClient handles REST API calls to Supabase
type SupabaseClient struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
	UseServiceRole bool
}

// SupabaseConfig holds configuration for Supabase connection
type SupabaseConfig struct {
	URL            string
	AnonKey        string
	ServiceRoleKey string
	UseServiceRole bool
}

// NewSupabaseClient creates a new Supabase REST API client
func NewSupabaseClient(config SupabaseConfig) *SupabaseClient {
	apiKey := config.AnonKey
	if config.UseServiceRole && config.ServiceRoleKey != "" {
		apiKey = config.ServiceRoleKey
	}

	return &SupabaseClient{
		BaseURL: config.URL,
		APIKey:  apiKey,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		UseServiceRole: config.UseServiceRole,
	}
}

// QueryBuilder helps build Supabase REST API queries
type QueryBuilder struct {
	client      *SupabaseClient
	table       string
	selectCols  string
	filters     []string
	orderBy     []string
	limit       int
	offset      int
	single      bool
}

// From starts a query on a specific table
func (c *SupabaseClient) From(table string) *QueryBuilder {
	return &QueryBuilder{
		client:     c,
		table:      table,
		selectCols: "*",
		filters:    []string{},
		orderBy:    []string{},
		limit:      0,
		offset:     0,
		single:     false,
	}
}

// Select specifies which columns to return
func (qb *QueryBuilder) Select(columns string) *QueryBuilder {
	qb.selectCols = columns
	return qb
}

// Eq adds an equality filter
func (qb *QueryBuilder) Eq(column, value string) *QueryBuilder {
	qb.filters = append(qb.filters, fmt.Sprintf("%s=eq.%s", column, url.QueryEscape(value)))
	return qb
}

// Neq adds a not-equal filter
func (qb *QueryBuilder) Neq(column, value string) *QueryBuilder {
	qb.filters = append(qb.filters, fmt.Sprintf("%s=neq.%s", column, url.QueryEscape(value)))
	return qb
}

// Gt adds a greater-than filter
func (qb *QueryBuilder) Gt(column, value string) *QueryBuilder {
	qb.filters = append(qb.filters, fmt.Sprintf("%s=gt.%s", column, url.QueryEscape(value)))
	return qb
}

// Gte adds a greater-than-or-equal filter
func (qb *QueryBuilder) Gte(column, value string) *QueryBuilder {
	qb.filters = append(qb.filters, fmt.Sprintf("%s=gte.%s", column, url.QueryEscape(value)))
	return qb
}

// Lt adds a less-than filter
func (qb *QueryBuilder) Lt(column, value string) *QueryBuilder {
	qb.filters = append(qb.filters, fmt.Sprintf("%s=lt.%s", column, url.QueryEscape(value)))
	return qb
}

// Lte adds a less-than-or-equal filter
func (qb *QueryBuilder) Lte(column, value string) *QueryBuilder {
	qb.filters = append(qb.filters, fmt.Sprintf("%s=lte.%s", column, url.QueryEscape(value)))
	return qb
}

// Like adds a LIKE filter (pattern matching)
func (qb *QueryBuilder) Like(column, pattern string) *QueryBuilder {
	qb.filters = append(qb.filters, fmt.Sprintf("%s=like.%s", column, url.QueryEscape(pattern)))
	return qb
}

// Ilike adds a case-insensitive LIKE filter
func (qb *QueryBuilder) Ilike(column, pattern string) *QueryBuilder {
	qb.filters = append(qb.filters, fmt.Sprintf("%s=ilike.%s", column, url.QueryEscape(pattern)))
	return qb
}

// Is adds an IS filter (for NULL checks)
func (qb *QueryBuilder) Is(column, value string) *QueryBuilder {
	qb.filters = append(qb.filters, fmt.Sprintf("%s=is.%s", column, url.QueryEscape(value)))
	return qb
}

// In adds an IN filter
func (qb *QueryBuilder) In(column string, values []string) *QueryBuilder {
	escapedValues := make([]string, len(values))
	for i, v := range values {
		escapedValues[i] = url.QueryEscape(v)
	}
	qb.filters = append(qb.filters, fmt.Sprintf("%s=in.(%s)", column, strings.Join(escapedValues, ",")))
	return qb
}

// Order adds ordering to the query
func (qb *QueryBuilder) Order(column string, ascending bool) *QueryBuilder {
	direction := "asc"
	if !ascending {
		direction = "desc"
	}
	qb.orderBy = append(qb.orderBy, fmt.Sprintf("%s.%s", column, direction))
	return qb
}

// Limit sets the maximum number of rows to return
func (qb *QueryBuilder) Limit(limit int) *QueryBuilder {
	qb.limit = limit
	return qb
}

// Offset sets the number of rows to skip
func (qb *QueryBuilder) Offset(offset int) *QueryBuilder {
	qb.offset = offset
	return qb
}

// Single indicates that we expect a single row result
func (qb *QueryBuilder) Single() *QueryBuilder {
	qb.single = true
	return qb
}

// buildURL constructs the full URL for the query
func (qb *QueryBuilder) buildURL() string {
	baseURL := fmt.Sprintf("%s/rest/v1/%s", qb.client.BaseURL, qb.table)
	params := url.Values{}

	params.Add("select", qb.selectCols)

	for _, filter := range qb.filters {
		parts := strings.SplitN(filter, "=", 2)
		if len(parts) == 2 {
			params.Add(parts[0], parts[1])
		}
	}

	if len(qb.orderBy) > 0 {
		params.Add("order", strings.Join(qb.orderBy, ","))
	}

	if qb.limit > 0 {
		params.Add("limit", fmt.Sprintf("%d", qb.limit))
	}

	if qb.offset > 0 {
		params.Add("offset", fmt.Sprintf("%d", qb.offset))
	}

	return fmt.Sprintf("%s?%s", baseURL, params.Encode())
}

// Execute executes the SELECT query and unmarshals the result
func (qb *QueryBuilder) Execute(ctx context.Context, result interface{}) error {
	req, err := http.NewRequestWithContext(ctx, "GET", qb.buildURL(), nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("apikey", qb.client.APIKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", qb.client.APIKey))
	req.Header.Set("Content-Type", "application/json")

	if qb.single {
		req.Header.Set("Accept", "application/vnd.pgrst.object+json")
	}

	resp, err := qb.client.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(body))
	}

	if err := json.Unmarshal(body, result); err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return nil
}

// Insert inserts one or more records into a table
func (c *SupabaseClient) Insert(ctx context.Context, table string, data interface{}, result interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	url := fmt.Sprintf("%s/rest/v1/%s", c.BaseURL, table)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("apikey", c.APIKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(body))
	}

	if result != nil {
		if err := json.Unmarshal(body, result); err != nil {
			return fmt.Errorf("failed to unmarshal response: %w", err)
		}
	}

	return nil
}

// Update updates records in a table that match the filters
func (c *SupabaseClient) Update(ctx context.Context, table string, filters map[string]string, data interface{}, result interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	baseURL := fmt.Sprintf("%s/rest/v1/%s", c.BaseURL, table)
	params := url.Values{}

	for column, value := range filters {
		params.Add(column, fmt.Sprintf("eq.%s", url.QueryEscape(value)))
	}

	fullURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	req, err := http.NewRequestWithContext(ctx, "PATCH", fullURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("apikey", c.APIKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=representation")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(body))
	}

	if result != nil {
		if err := json.Unmarshal(body, result); err != nil {
			return fmt.Errorf("failed to unmarshal response: %w", err)
		}
	}

	return nil
}

// Delete deletes records from a table that match the filters
func (c *SupabaseClient) Delete(ctx context.Context, table string, filters map[string]string) error {
	baseURL := fmt.Sprintf("%s/rest/v1/%s", c.BaseURL, table)
	params := url.Values{}

	for column, value := range filters {
		params.Add(column, fmt.Sprintf("eq.%s", url.QueryEscape(value)))
	}

	fullURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	req, err := http.NewRequestWithContext(ctx, "DELETE", fullURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("apikey", c.APIKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}

// Upsert inserts or updates records (based on primary key or unique constraints)
func (c *SupabaseClient) Upsert(ctx context.Context, table string, data interface{}, result interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal data: %w", err)
	}

	url := fmt.Sprintf("%s/rest/v1/%s", c.BaseURL, table)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("apikey", c.APIKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "resolution=merge-duplicates,return=representation")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(body))
	}

	if result != nil {
		if err := json.Unmarshal(body, result); err != nil {
			return fmt.Errorf("failed to unmarshal response: %w", err)
		}
	}

	return nil
}

// Count returns the count of rows matching the filters
func (c *SupabaseClient) Count(ctx context.Context, table string, filters map[string]string) (int, error) {
	baseURL := fmt.Sprintf("%s/rest/v1/%s", c.BaseURL, table)
	params := url.Values{}
	params.Add("select", "count")

	for column, value := range filters {
		params.Add(column, fmt.Sprintf("eq.%s", url.QueryEscape(value)))
	}

	fullURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	req, err := http.NewRequestWithContext(ctx, "HEAD", fullURL, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("apikey", c.APIKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))
	req.Header.Set("Prefer", "count=exact")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return 0, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return 0, fmt.Errorf("supabase error (status %d)", resp.StatusCode)
	}

	contentRange := resp.Header.Get("Content-Range")
	if contentRange == "" {
		return 0, fmt.Errorf("no Content-Range header in response")
	}

	// Parse content range (format: "0-10/42" where 42 is total count)
	parts := strings.Split(contentRange, "/")
	if len(parts) != 2 {
		return 0, fmt.Errorf("invalid Content-Range format: %s", contentRange)
	}

	var count int
	_, err = fmt.Sscanf(parts[1], "%d", &count)
	if err != nil {
		return 0, fmt.Errorf("failed to parse count from Content-Range: %w", err)
	}

	return count, nil
}

// RPC calls a Supabase stored procedure/function
func (c *SupabaseClient) RPC(ctx context.Context, functionName string, params interface{}, result interface{}) error {
	jsonData, err := json.Marshal(params)
	if err != nil {
		return fmt.Errorf("failed to marshal params: %w", err)
	}

	url := fmt.Sprintf("%s/rest/v1/rpc/%s", c.BaseURL, functionName)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("apikey", c.APIKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("supabase error (status %d): %s", resp.StatusCode, string(body))
	}

	if result != nil {
		if err := json.Unmarshal(body, result); err != nil {
			return fmt.Errorf("failed to unmarshal response: %w", err)
		}
	}

	return nil
}
