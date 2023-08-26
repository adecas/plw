// Written by Attractive Chaos; distributed under the MIT license

final class matmul {

    private static double[][] matgen(final int n, final double seed) {
        final double[][] a = new double[n][n];
        final double tmp = seed / n / n;
        for (int i = 0; i < n; ++i)
            for (int j = 0; j < n; ++j)
                a[i][j] = tmp * (i - j) * (i + j);
        return a;
    }

    private static double[][] matmul(final double[][] a, final double[][] b) {
        final int m = a.length;
        final int n = a[0].length;
        final int p = b[0].length;
        final double[][] x = new double[m][p];
        final double[][] c = new double[p][n];
        for (int i = 0; i < n; ++i) // transpose
            for (int j = 0; j < p; ++j)
                c[j][i] = b[i][j];
        for (int i = 0; i < m; ++i)
            for (int j = 0; j < p; ++j) {
                double s = 0.0;
                for (int k = 0; k < n; ++k)
                    s += a[i][k] * c[j][k];
                x[i][j] = s;
            }
        return x;
    }

    private static double calc(final int n) {
        final int size = n / 2 * 2;
        final double[][] a = matgen(size, 1.0);
        final double[][] b = matgen(size, 2.0);
        final double[][] x = matmul(a, b);
        return x[size / 2][size / 2];
    }

    public static void main(String[] args) {
        final int n = args.length > 0 ? Integer.valueOf(args[0]) : 100;

        final double left = calc(101);
        final double right = -18.67;
        if (Math.abs(left - right) > 0.1) {
            System.err.printf("%f != %f\n", left, right);
            System.exit(1);
        }

        final long start_time = System.currentTimeMillis();
        final double results = calc(n);
        final long time_diff = System.currentTimeMillis() - start_time;

        System.out.println(results);
        System.out.printf("time: %f s\n", time_diff / 1e3);
    }
}

