from setuptools import setup

setup(name='openwork-board-operator-bot',
      version='0.0.1',
      description='OpenWork Board Operator',
      author='Digital Asset',
      license='Apache2',
      install_requires=['dazl'],
      packages=['bot'],
      include_package_data=True)
