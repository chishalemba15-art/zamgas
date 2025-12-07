// twilio.go
package auth

import (
	"fmt"

	"github.com/twilio/twilio-go"
	twilioApi "github.com/twilio/twilio-go/rest/api/v2010"
)

type TwilioClient struct {
	client     *twilio.RestClient
	serviceSid string
	accountSid string
	authToken  string
	fromNumber string
}

func NewTwilioClient(accountSid, authToken, fromNumber string) *TwilioClient {
	client := twilio.NewRestClientWithParams(twilio.ClientParams{
		Username: accountSid,
		Password: authToken,
	})

	fmt.Println("Created the Twilio Client....")

	return &TwilioClient{
		client:     client,
		accountSid: accountSid,
		authToken:  authToken,
		fromNumber: fromNumber,
	}
}

func (t *TwilioClient) SendVerificationCode(phoneNumber string) error {
	params := &twilioApi.CreateMessageParams{}

	// Generate a random 6-digit code
	code := fmt.Sprintf("%06d", generateRandomCode())

	message := fmt.Sprintf("Your ZamGas verification code is: %s", code)

	params.SetTo(phoneNumber)
	params.SetFrom(t.fromNumber)
	params.SetBody(message)
	params.SetApplicationSid(t.accountSid)

	response, err := t.client.Api.CreateMessage(params)
	if err != nil {
		return fmt.Errorf("failed to send SMS: %w", err)
	}
	fmt.Println(response.Body)
	// Store the code in a temporary storage (e.g., Redis) with expiration
	err = storeVerificationCode(phoneNumber, code)
	if err != nil {
		return fmt.Errorf("failed to store verification code: %w", err)
	}

	return nil
}
