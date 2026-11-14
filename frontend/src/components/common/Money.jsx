import { formatAmount } from '../../utils/money';
import { currencyLabel } from '../../utils/currency';

// One way to show money everywhere: the number (with its sign) in its own left-to-right run,
// so «-340» never turns into «340-» inside Arabic text, then a space and the currency symbol.
const Money = ({ amount, currency, sign = '', className = '', currencyClassName = '' }) => (
  <span className={`whitespace-nowrap ${className}`}>
    <span className="num">
      {sign}
      {formatAmount(amount)}
    </span>{' '}
    <span className={`text-[0.75em] font-normal ${currencyClassName}`}>
      {currencyLabel(currency)}
    </span>
  </span>
);

export default Money;
