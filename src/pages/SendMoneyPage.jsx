import SendMoneyForm from '../components/SendMoneyForm';

export default function SendMoneyPage() {
  return (
    <>
      <title>Send Money — NairaFlow</title>
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Send Money</h1>
        <SendMoneyForm />
      </div>
    </>
  );
}
