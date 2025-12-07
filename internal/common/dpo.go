package common

import (
	"bytes"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"math"
	"net/http"
	"strings"
	"time"
)

const (
	baseURL      = "https://secure.3gdirectpay.com/API/v6/"
	companyToken = "8D3DA73D-9D7F-4E09-96D4-3D44E7A83EA3"
)

type Client struct {
	CompanyToken string
	BaseURL      string
	HTTPClient   *http.Client
}

func NewClient(companyToken, baseURL string) *Client {
	return &Client{
		CompanyToken: companyToken,
		BaseURL:      baseURL,
		HTTPClient:   &http.Client{},
	}
}

type CreateTokenRequest struct {
	XMLName      xml.Name    `xml:"API3G"`
	CompanyToken string      `xml:"CompanyToken"`
	Request      string      `xml:"Request"`
	Transaction  Transaction `xml:"Transaction"`
	Services     Services    `xml:"Services"`
}

type Transaction struct {
	PaymentAmount    float64 `xml:"PaymentAmount"`
	PaymentCurrency  string  `xml:"PaymentCurrency"`
	CompanyRef       string  `xml:"CompanyRef"`
	RedirectURL      string  `xml:"RedirectURL"`
	BackURL          string  `xml:"BackURL"`
	CompanyRefUnique int     `xml:"CompanyRefUnique"` // Changed to int
	PTL              int     `xml:"PTL"`
}
type Service struct {
	ServiceType        int    `xml:"ServiceType"`
	ServiceDescription string `xml:"ServiceDescription"`
	ServiceDate        string `xml:"ServiceDate"`
}

type Services struct {
	Service []Service `xml:"Service"`
}

type CreateTokenResponse struct {
	XMLName           xml.Name `xml:"API3G"`
	Result            string   `xml:"Result"`
	ResultExplanation string   `xml:"ResultExplanation"`
	TransToken        string   `xml:"TransToken"`
	TransRef          string   `xml:"TransRef"`
}

// VerifyTokenRequest represents the request structure for verifying a token
type VerifyTokenRequest struct {
	XMLName             xml.Name `xml:"API3G"`
	CompanyToken        string   `xml:"CompanyToken"`
	Request             string   `xml:"Request"`
	TransactionToken    string   `xml:"TransactionToken"`
	CompanyRef          string   `xml:"CompanyRef,omitempty"`
	VerifyTransaction   int      `xml:"VerifyTransaction,omitempty"`
	ACCref              string   `xml:"ACCref,omitempty"`
	CustomerPhone       string   `xml:"customerPhone,omitempty"`
	CustomerPhonePrefix int      `xml:"customerPhonePrefix,omitempty"`
	CustomerEmail       string   `xml:"customerEmail,omitempty"`
}

// VerifyTokenResponse represents the response structure from verifying a token
type VerifyTokenResponse struct {
	XMLName                         xml.Name `xml:"API3G"`
	Result                          string   `xml:"Result"`
	ResultExplanation               string   `xml:"ResultExplanation"`
	CustomerName                    string   `xml:"CustomerName"`
	CustomerCredit                  string   `xml:"CustomerCredit"`
	CustomerCreditType              string   `xml:"CustomerCreditType"`
	TransactionApproval             string   `xml:"TransactionApproval"`
	TransactionCurrency             string   `xml:"TransactionCurrency"`
	TransactionAmount               string   `xml:"TransactionAmount"`
	FraudAlert                      string   `xml:"FraudAlert"`
	FraudExplanation                string   `xml:"FraudExplanation"`
	TransactionNetAmount            string   `xml:"TransactionNetAmount"`
	TransactionSettlementDate       string   `xml:"TransactionSettlementDate"`
	TransactionRollingReserveAmount string   `xml:"TransactionRollingReserveAmount"`
	TransactionRollingReserveDate   string   `xml:"TransactionRollingReserveDate"`
	CustomerPhone                   string   `xml:"CustomerPhone"`
	CustomerCountry                 string   `xml:"CustomerCountry"`
	CustomerAddress                 string   `xml:"CustomerAddress"`
	CustomerCity                    string   `xml:"CustomerCity"`
	CustomerZip                     string   `xml:"CustomerZip"`
	MobilePaymentRequest            string   `xml:"MobilePaymentRequest"`
	AccRef                          string   `xml:"AccRef"`
	TransactionFinalCurrency        string   `xml:"TransactionFinalCurrency"`
	TransactionFinalAmount          string   `xml:"TransactionFinalAmount"`
}

type API3GResponse struct {
	XMLName             xml.Name `xml:"API3G"`
	Result              string   `xml:"Result"`
	ResultExplanation   string   `xml:"ResultExplanation"`
	CustomerName        string   `xml:"CustomerName"`
	CustomerCredit      string   `xml:"CustomerCredit"`
	CustomerCreditType  string   `xml:"CustomerCreditType"`
	TransactionApproval string   `xml:"TransactionApproval"`
	TransactionCurrency string   `xml:"TransactionCurrency"`
	TransactionAmount   string   `xml:"TransactionAmount"`
	FraudAlert          string   `xml:"FraudAlert"`
	FraudExplanation    string   `xml:"FraudExplnation"`
	// Add other fields as needed
}

func (c *Client) CreateToken(req *CreateTokenRequest) (*CreateTokenResponse, error) {
	req.CompanyToken = companyToken
	req.Request = "createToken"
	fmt.Println("Redirect url %s", req.Transaction.RedirectURL)
	xmlData, err := xml.MarshalIndent(req, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %w", err)
	}

	resp, err := c.HTTPClient.Post(baseURL, "application/xml", bytes.NewBuffer(xmlData))
	if err != nil {
		return nil, fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %w", err)
	}

	// Remove the check for HTML content as it's causing false positives

	var createTokenResp CreateTokenResponse
	err = xml.Unmarshal(body, &createTokenResp)
	if err != nil {
		return nil, fmt.Errorf("error unmarshaling response: %w", err)
	}

	if createTokenResp.Result != "000" {
		return nil, fmt.Errorf("API error: %s - %s", createTokenResp.Result, createTokenResp.ResultExplanation)
	}

	return &createTokenResp, nil
}

// VerifyToken sends a request to verify a transaction token
func (c *Client) VerifyToken(req *VerifyTokenRequest) (*VerifyTokenResponse, error) {
	req.CompanyToken = companyToken
	req.Request = "verifyToken"

	xmlData, err := xml.MarshalIndent(req, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %w", err)
	}

	resp, err := c.HTTPClient.Post(baseURL, "application/xml", bytes.NewBuffer(xmlData))
	if err != nil {
		return nil, fmt.Errorf("error sending request: %w", err)
	}

	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %w", err)
	}

	// Trim any leading whitespace or byte order mark
	body = bytes.TrimLeft(body, " \t\n\r\xef\xbb\xbf")

	var verifyTokenResp VerifyTokenResponse
	err = xml.Unmarshal(body, &verifyTokenResp)
	if err != nil {
		return nil, fmt.Errorf("error unmarshaling response: %w", err)
	}

	return &verifyTokenResp, nil
}

func (c *Client) VerifyTokenWithRetry(req *VerifyTokenRequest, maxRetries int) (*VerifyTokenResponse, error) {
	var lastErr error
	for i := 0; i < maxRetries; i++ {
		resp, err := c.VerifyToken(req)
		if err == nil {
			return resp, nil
		}
		lastErr = err
		backoffDuration := time.Duration(math.Pow(2, float64(i))) * time.Second
		log.Printf("Attempt %d failed: %v. Retrying in %v...", i+1, err, backoffDuration)
		time.Sleep(backoffDuration)
	}
	return nil, fmt.Errorf("failed to verify token after %d attempts: %w", maxRetries, lastErr)
}

func parseXML(rawXML string) (*API3GResponse, error) {
	// Find the start of the  tag
	startIndex := strings.Index(rawXML, "")
	if startIndex == -1 {
		return nil, errors.New(" tag not found in the response")
	}

	// Extract the XML content starting from
	xmlContent := rawXML[startIndex:]

	var response API3GResponse
	err := xml.Unmarshal([]byte(xmlContent), &response)
	if err != nil {
		return nil, err
	}

	return &response, nil
}

type ChargeTokenMobileRequest struct {
	XMLName          xml.Name `xml:"API3G"`
	CompanyToken     string   `xml:"CompanyToken"`
	Request          string   `xml:"Request"`
	TransactionToken string   `xml:"TransactionToken"`
	PhoneNumber      string   `xml:"PhoneNumber"`
	MNO              string   `xml:"MNO"`
	MNOcountry       string   `xml:"MNOcountry"`
}

// ChargeTokenMobileResponse represents the response structure for a mobile charge request
type ChargeTokenMobileResponse struct {
	ResultExplanation string `xml:"ResultExplanation"`
	StatusCode        string `xml:"StatusCode"`
	Instructions      string `xml:"Instructions"`
	TransRef          string `xml:"TransRef"`
	TransToken        string `xml:"TransToken"`
}

type GetMobilePaymentOptionsRequest struct {
	XMLName      xml.Name `xml:"API3G"`
	CompanyToken string   `xml:"CompanyToken"`
	Request      string   `xml:"Request"`
}

type GetMobilePaymentOptionsResponse struct {
	XMLName              xml.Name             `xml:"API3G"`
	PaymentOptionsMobile PaymentOptionsMobile `xml:"paymentoptionsmobile"`
}

type PaymentOptionsMobile struct {
	TerminalMobile []TerminalMobile `xml:"terminalmobile"`
}

type TerminalMobile struct {
	TerminalRedirectURI string `xml:"terminalredirecturi"`
	TerminalType        string `xml:"terminaltype"`
	TerminalMNO         string `xml:"terminalmno"`
	TerminalMNOCountry  string `xml:"terminalmnocountry"`
	TerminalLogo        string `xml:"terminallogo"`
	CellularPrefix      string `xml:"cellularprefix"`
}

func (c *Client) ChargeTokenMobile(transactionToken, phoneNumber, mno, mnoCountry string) (*ChargeTokenMobileResponse, error) {
	req := &ChargeTokenMobileRequest{
		CompanyToken:     c.CompanyToken,
		Request:          "chargeTokenMobile",
		TransactionToken: transactionToken,
		PhoneNumber:      phoneNumber,
		MNO:              mno,
		MNOcountry:       mnoCountry,
	}

	resp := &ChargeTokenMobileResponse{}
	err := c.sendRequest("POST", "chargeTokenMobile", req, resp)
	if err != nil {
		return nil, fmt.Errorf("error charging token mobile: %w", err)
	}

	return resp, nil
}

func (c *Client) sendRequest(method, endpoint string, req interface{}, resp interface{}) error {
	// Encode the request body as XML
	var body io.Reader
	if req != nil {
		xmlBody, err := xml.Marshal(req)
		if err != nil {
			return fmt.Errorf("error encoding request body: %w", err)
		}
		body = bytes.NewReader(xmlBody)
	}

	// Construct the full URL
	url := fmt.Sprintf("%s/%s", strings.TrimRight(c.BaseURL, "/"), endpoint)

	// Create the HTTP request
	httpReq, err := http.NewRequest(method, url, body)
	if err != nil {
		return fmt.Errorf("error creating request: %w", err)
	}

	// Set headers
	httpReq.Header.Set("Content-Type", "application/xml")

	// Send the request
	httpResp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("error sending request: %w", err)
	}
	defer httpResp.Body.Close()

	// Read the response body
	respBody, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return fmt.Errorf("error reading response body: %w", err)
	}

	// Check for a successful status code
	if httpResp.StatusCode < 200 || httpResp.StatusCode >= 300 {
		return fmt.Errorf("API request failed with status code %d: %s", httpResp.StatusCode, string(respBody))
	}

	// Decode the response body
	if resp != nil {
		err = xml.Unmarshal(respBody, resp)
		if err != nil {
			return fmt.Errorf("error decoding response body: %w", err)
		}
	}

	return nil
}

func (c *Client) GetMobilePaymentOptions(transactionToken string) (*GetMobilePaymentOptionsResponse, error) {
	request := &GetMobilePaymentOptionsRequest{
		CompanyToken: c.CompanyToken,
		Request:      "GetMobilePaymentOptionsByCompanyToken",
	}

	xmlRequest, err := xml.MarshalIndent(request, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %v", err)
	}

	resp, err := http.Post(c.BaseURL, "application/xml", bytes.NewBuffer(xmlRequest))
	if err != nil {
		return nil, fmt.Errorf("error sending request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %v", err)
	}

	// Replace problematic character entities
	bodyStr := string(body)
	bodyStr = strings.ReplaceAll(bodyStr, "‚", "'")
	bodyStr = strings.ReplaceAll(bodyStr, "’", "'")

	var response GetMobilePaymentOptionsResponse
	err = xml.Unmarshal([]byte(bodyStr), &response)
	if err != nil {
		// If there's still an error, print the response for debugging

		return nil, fmt.Errorf("error decoding response: %v", err)
	}

	return &response, nil
}
