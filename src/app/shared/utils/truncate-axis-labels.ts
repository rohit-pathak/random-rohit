import { select } from "d3";

/**
 * Returns truncated version of the axis labels based on targetWidget.
 */
export function getTruncatedLabelText(labels: string[], targetWidth: number): Map<string, string> {
  const res = new Map<string, string>();
  for (const label of labels) {
    res.set(label, truncateAxisLabel(label, targetWidth))
  }
  return res;
}

export function truncateAxisLabel(label: string, targetWidth: number): string {
  const tempSvg = select('body')
    .append('svg')
    .attr('width', 0)
    .attr('height', 0)
  const tempTextBox = tempSvg
    .append('text')
    .attr('class', 'temp-box')
    .attr('font-size', 10) // d3 adds these styles to the axis group
    .attr('font-family', 'sans-serif')
    .attr('visibility', 'hidden');

  tempTextBox.text(label);
  const width = tempTextBox.node()?.getBoundingClientRect().width ?? 0;
  if (width <= targetWidth) {
    tempSvg.remove();
    return label;
  }

  // binary search for the correct width
  let start = 0;
  let end = label.length - 1;
  let lastValidTruncated = label;
  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const truncatedText = label.substring(0, mid + 1) + '...';
    tempTextBox.text(truncatedText);
    const width = tempTextBox.node()?.getBoundingClientRect().width ?? 0;
    if (width <= targetWidth) {
      lastValidTruncated = truncatedText;
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  tempSvg.remove();
  return lastValidTruncated;
}
