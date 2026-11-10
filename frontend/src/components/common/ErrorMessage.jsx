import { Alert, Button } from 'antd';

/** Inline error with an optional retry action. */
export default function ErrorMessage({ title = 'Something went wrong', message, onRetry }) {
  return (
    <Alert
      type="error"
      showIcon
      message={title}
      description={message}
      action={onRetry && <Button size="small" onClick={onRetry}>Try again</Button>}
    />
  );
}
