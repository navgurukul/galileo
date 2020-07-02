
echo "COURSE : "$1" UPDATED"
echo "(Unless Error Message is attached here.)"

#cd /home/galileo

export GALILEO_ENV='prod'
cd curriculum
git pull > /dev/null
cd ..
if [ "$1" == "all" ]
then
	for input in $(find . -name "info.md" | awk -F'\/' '{print $3}')
	do
		ts-node src/seed-courses/index.ts --courseDir=$input
	done
else
  echo "ts-node src/seed-courses/index.ts --courseDir $1"
	ts-node src/seed-courses/index.ts --courseDir=$1
fi
